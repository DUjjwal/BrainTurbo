"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {  createElement, useEffect, useRef, useState } from "react";
import ProfileDropdown from "../components/index";
import { Crimson_Text } from "next/font/google";
import { escape } from "querystring";



// const url = `ws://localhost:4000?token=${session.data.user.idToken}`
//     const ws = new WebSocket(url)
//     ws.onopen = (msg) => {
//       console.log('connection success from client side')
//     }
//     ws.onmessage = (msg) => {
//       console.log(msg)
//     }


type Point = {
  x: number,
  y: number
}

type Rectangle = {
  type: 'rect',
  x: number,
  y: number,
  width: number,
  height: number,
  lineWidth: number,
  lineDash: number[],
  color: string
}

type Line = {
  type: 'line',
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  lineWidth: number,
  lineDash: number[],
  color: string
}

type Circle = {
  type: 'circle',
  x: number,
  y: number,
  r: number,
  lineWidth: number,
  lineDash: number[],
  color: string
}

type Path = {
  type: 'path',
  points: Point[],
  lineWidth: number,
  lineDash: number[],
  color: string
}

type Shape = Rectangle | Line | Path | Circle

export default function Page() {
  const mouseSendEvent = useRef<ReturnType<typeof setInterval>>(null);
  const router = useRouter()
  const session = useSession()

  const valid = useRef<boolean>(false)


  const ROOMID = useRef<string|null>(null)
  const USERID = useRef<string|null>(null)
  const USERNAME = useRef<string|null>(null)

  

  const socket = useRef<WebSocket | null>(null)
  const [roomId, setRoomId] = useState("")
  
  const ref = useRef<HTMLCanvasElement>(null)
  
  const shapes = useRef<Shape[]>([])

  const color = useRef<string>("blue")
  const [ C, setC ] = useState<string>("blue")

  const lineWidth = useRef<number>(1)
  const [ L, setL ] = useState<number>(1)

  const lineDash = useRef<number[]>([])
  const [ LD, setLD ] = useState<number>(1)

  const cursor = useRef<string>("R")
  const [cursorState, setCursorState] = useState<string>("R")

  const fontSize = useRef<number>(20)
  const [ F, setF ] = useState<number>(1)

  const textAlign = useRef<string>('left')
  const [ T, setT ] = useState<number>(1)

  const prevMouseX = useRef<number>(-1)
  const prevMouseY = useRef<number>(-1)
  const mouseX = useRef<number>(0)
  const mouseY = useRef<number>(0)
  

  const oldShape = useRef<Shape>(null)
  const newShape = useRef<Shape>(null)

  const oldText = useRef<string>("")

  const oldleft = useRef<number>(-1)
  const oldtop = useRef<number>(-1)

  function observeTextArea(textarea: HTMLTextAreaElement) {
    const ro = new ResizeObserver(() => {
      // Whenever resize happens, mark as false
      valid.current = false;

      // Clear any previous timer
      if ((observeTextArea as any)._timeout) {
        clearTimeout((observeTextArea as any)._timeout);
      }

      // After 200ms of no resize events, mark as true
      (observeTextArea as any)._timeout = setTimeout(() => {
        valid.current = true;
      }, 200);
    });

    ro.observe(textarea);
  }
  

  function DrawRect() {
    
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if(!ctx || !canvas)return;
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    shapes.current.forEach((obj: Shape) => {
      if(obj.type === 'rect') {
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.lineWidth
        ctx.setLineDash(obj.lineDash)
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
      }
      else if(obj.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(obj.startX, obj.startY)
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.lineWidth
        ctx.setLineDash(obj.lineDash)
        ctx.lineTo(obj.endX, obj.endY)
        ctx.stroke()
      }
      else if(obj.type === 'circle') {
        ctx.beginPath()
        ctx.strokeStyle = obj.color
        ctx.lineWidth = obj.lineWidth
        ctx.setLineDash(obj.lineDash)
        ctx.arc(obj.x, obj.y, obj.r, 0, 2*Math.PI)
        ctx.stroke()
      }
      else if(obj.type === 'path') {
        for(let i = 1; i<obj.points.length; i++) {
          const p1 = obj.points[i-1], p2 = obj.points[i]
          if(!p1 || !p2)return;
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = obj.color
          ctx.lineWidth = obj.lineWidth
          ctx.setLineDash(obj.lineDash)
          ctx.stroke()
        }
      }
    })

  }


  function OnPath(e: globalThis.MouseEvent): number {
    let idx = -1
    const rect = ref.current?.getBoundingClientRect()
    const px = e.clientX - (rect?.left ?? 0)
    const py = e.clientY - (rect?.top ?? 0)

    shapes.current.forEach((obj, index) => {
      if (obj.type === 'path') {
        const pts = obj.points
        for (let i = 1; i < pts.length; i++) {
          const p1 = pts[i-1], p2 = pts[i]
          if(!p1 || !p2)return;
          const x1 = p1.x
          const y1 = p1.y
          const x2 = p2.x
          const y2 = p2.y

          if (isPointNearLine(x1, y1, x2, y2, px + (rect?.left ?? 0), py + (rect?.top ?? 0))) {
            idx = index
          }
        }
      }
    })

    return idx
  }

  function createTextBox(left: number, right: number, val: string): void {
    const text = document.createElement('textarea')
    text.style.position = 'fixed'
    text.style.left = `${left}px`
    text.style.top = `${right}px`
    text.style.border = 'none'
    text.style.outline = 'none'
    text.style.resize = 'both'
    text.style.background = 'transparent'
    text.style.fontSize = `${fontSize.current}px`
    text.style.color = color.current
    text.id = 'text-box'
    text.style.textAlign = textAlign.current
    text.value = `${val}`
    observeTextArea(text)
    document.body.append(text)
    setTimeout(() => {
      text.focus()
      text.addEventListener('focus', () => {
        text.style.outline = `1px solid #d2d4d6`
      })
      text.addEventListener('blur', () => {
        const txt = text.value.trim()
        if(!txt) {
          document.body.removeChild(text)
        }
        else {
          const left = Number(text.style.left.slice(0,text.style.left.length-2))
          const top = Number(text.style.top.slice(0,text.style.top.length-2))
          if(socket.current && txt !== oldText.current) {
            socket.current.send(JSON.stringify({
              type: 'text',
              roomid: Number(localStorage.getItem('roomid')),
              userid: localStorage.getItem('userid'),
              left,
              top,
              text: txt
            }))
          }
          text.style.outline = 'none'
          text.readOnly = true
        }
      })
      text.addEventListener('dblclick', () => {
        text.readOnly = false
        text.focus()
        setCursorState('A')
        cursor.current = 'A'
      })
      setCursorState('A')
      cursor.current = 'A'
    }, 5)
  }

  function isPointNearLine(x1: number, y1: number, x2: number, y2: number, px: number, py: number): boolean {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const tolerance = 5

    const rect = ref.current?.getBoundingClientRect()

    
    px = px - (rect?.left ?? 0);
    py = py - (rect?.top ?? 0);


    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let nearestX, nearestY;

    if (param < 0) {
      nearestX = x1;
      nearestY = y1;
    } else if (param > 1) {
      nearestX = x2;
      nearestY = y2;
    } else {
      nearestX = x1 + param * C;
      nearestY = y1 + param * D;
    }

    const dx = px - nearestX;
    const dy = py - nearestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= tolerance;
  }

  function onLine(e: globalThis.MouseEvent): number {
    const x = e.clientX, y = e.clientY
    let idx = -1
    shapes.current.forEach((obj, index) => {
      if(obj.type !== 'line')return;
      if(isPointNearLine(obj.startX, obj.startY, obj.endX, obj.endY, x, y)) {
        idx = index
      }
    })
    return idx
  }

  function onCircle(e: globalThis.MouseEvent): number {
    let idx = -1

    const rect = ref.current?.getBoundingClientRect()


    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);

    shapes.current.forEach((obj, index) => {
      if(obj.type === 'circle') {
        const dx = obj.x - x
        const dy = obj.y - y
  
        const d = Math.sqrt(dx*dx + dy*dy)
        
        if((d >= obj.r - 5) && (d <= obj.r + 5)) {
          idx = index
        }

      }
    })
    return idx
  }

  function onRectangle(e: globalThis.MouseEvent): number {
    const tolerance = 3;

    const rect = ref.current?.getBoundingClientRect()

    
    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);

    let idx = -1;

    shapes.current.forEach((obj, index) => {
      if (obj.type !== 'rect') return;

      const left = obj.x;
      const right = obj.x + obj.width;
      const top = obj.y;
      const bottom = obj.y + obj.height;

      const onLeft = Math.abs(x - left) <= tolerance && y >= top && y <= bottom;
      const onRight = Math.abs(x - right) <= tolerance && y >= top && y <= bottom;
      const onTop = Math.abs(y - top) <= tolerance && x >= left && x <= right;
      const onBottom = Math.abs(y - bottom) <= tolerance && x >= left && x <= right;

      if (onLeft || onRight || onTop || onBottom) {
        idx = index;
      }
    });

    return idx; 
  }

  function onTextBox(e: globalThis.MouseEvent): number {
    const x = e.clientX, y =e.clientY
    let idx = -1
    const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
    arr.forEach((obj, index) => {
      const x1 = obj.offsetLeft, x2 = x1 + obj.offsetWidth
      const y1 = obj.offsetTop, y2 = y1 + obj.offsetHeight
      if(x >= x1 && x <= x2 && y >= y1 && y<= y2) {
        idx = index
      }
    })
    return idx
  }

  function onOptionsPane(e: globalThis.MouseEvent): boolean {
    let div: HTMLElement | null = document.getElementById('options')
    if(!div)return false;
    let x1 = div?.offsetLeft, x2 = x1 + div?.offsetWidth
    let y1 = div?.offsetTop, y2 = y1 + div?.offsetTop
    let x = e.clientX, y = e.clientY
    const ans = x >= x1 - 5 && x <= x2 + 5 && y >= y1 - 5 && y <= y2 + 5;

    div = document.getElementById('options2')
    if(!div)return ans;
    x1 = div?.offsetLeft 
    x2 = x1 + div?.offsetWidth;
    y1 = div?.offsetTop 
    y2 = y1 + div?.offsetTop;
    x = e.clientX 
    y = e.clientY;
    return (ans || (x >= x1 - 15 && x <= x2 + 15 && y >= y1 - 15 && y <= y2 + 15))
  }
  
  //for reload working fine
  useEffect(() => {
    if(session && session.status === 'authenticated') {
      //@ts-ignore
      const ws = new WebSocket(`ws://localhost:4000?token=${session.data.user.idToken}`)
      ws.onopen = () => {
        if(ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'connect',
            roomid: Number(localStorage.getItem('roomid')),
            userid: localStorage.getItem('userid'),
            username: localStorage.getItem('username')
          }))
          socket.current = ws
        }
      }
      ws.onmessage = (msg) => {
        const store = JSON.parse(JSON.stringify(shapes.current))
        const parsed = JSON.parse(msg.data)
        if(parsed.type === 'delete') {
          const shapesUpdates = shapes.current.filter((obj) => JSON.stringify(obj) !== JSON.stringify(parsed.data))
          shapes.current = shapesUpdates
          const canvas = ref.current
          const ctx = canvas?.getContext("2d")
          if(!ctx || !canvas)return;
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          DrawRect()
        }
        else if(parsed.type === 'mousemove') {
          let div = document.getElementById(`${parsed.userid}`)
          let name = parsed.username.split(" ")[0].trim()
          if(name.length > 8) {
            name = name.slice(0,6)
            name += ".."
          }

          if(!div) {
            div = document.createElement(`div`)
            div.style.position = 'fixed'
            div.style.display = 'flex'
            div.style.flexDirection = 'column'
            div.style.justifyContent = 'center'
            div.id = `${parsed.userid}`
            div.innerHTML = `<svg width="25px" height="25px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" aria-labelledby="cursorIconTitle" stroke="lab(44.0605% 29.0279 -86.0352)" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" fill="none" color="lab(44.0605% 29.0279 -86.0352)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><polygon points="7 20 7 4 19 16 12 16 7 21"></polygon> </g></svg><p style="font-size:10px;color:#155DFB">${name}</p>`
            document.getElementById('main')?.appendChild(div)
          }
          div.style.left = `${parsed.x}px`
          div.style.top = `${parsed.y}px`
        }
        else if(parsed.type === 'disconnect') {
          const div = document.getElementById(`${parsed.userid}`)
          if(div) {
            div.remove();
          }
        }
        else if(parsed.type === 'textmove') {
          console.log('received text move')
          const arr: HTMLTextAreaElement[] = Array.from(document.querySelectorAll('#text-box'))
          arr.forEach((obj) => {
            const left = Number(obj.style.left.slice(0, obj.style.left.length - 2))
            const top = Number(obj.style.top.slice(0, obj.style.top.length - 2))
            console.log(left, top, parsed.oldleft, parsed.oldtop)
            if(left === parsed.oldleft && top === parsed.oldtop) {
              console.log('hua')
              obj.style.left = `${parsed.newleft}px`
              obj.style.top = `${parsed.newtop}px`
            }
            console.log(obj)
          })
        }
        else if(parsed.type === 'move') {
          const updateShape: Shape[] = []
          shapes.current.forEach((obj) => {
            if(JSON.stringify(obj) === JSON.stringify(parsed.oldshape))
              updateShape.push(parsed.newshape)
            else
              updateShape.push(obj)
          })
          shapes.current = updateShape
          DrawRect()
        }
        else if(parsed.type === 'deltext') {
          // console.log('received')
          const arr: HTMLTextAreaElement[] =Array.from(document.querySelectorAll('#text-box'))
          arr.forEach((obj) => {
            // console.log(obj.style.left, `${parsed.left}px`, obj.style.top, )
            if(obj.style.left === `${parsed.left}px` && obj.style.top === `${parsed.top}px`)
              obj.remove();
          })
        }
        else if(parsed.type === 'text') {
          console.log('received text')
          let flag: boolean = false
          const arr: HTMLTextAreaElement[] = Array.from(document.querySelectorAll('#text-box'))
          arr.forEach((obj) => {
            if(obj.style.left === `${parsed.left}px` && obj.style.top === `${parsed.top}px`) {
              flag = true
              obj.value = parsed.text
            }
          })
          if(flag === false) {
            createTextBox(parsed.left, parsed.top, parsed.text)
            
          }
        }
        else {
          shapes.current.push(JSON.parse(msg.data))
          DrawRect()

        }
      }
      ws.onclose = () => {
        router.push("/")
      }
      
      
    }
    
  }, [session, session.status])

  useEffect(() => {
    ROOMID.current = localStorage.getItem('roomid')
    USERID.current = localStorage.getItem('userid')
    USERNAME.current = localStorage.getItem('username')
    console.log(ROOMID.current, USERID.current, USERNAME.current)
    mouseSendEvent.current = setInterval(() => {
      if(socket.current && mouseX.current !== prevMouseX.current && mouseY.current !== prevMouseY.current)  {
        socket.current.send(JSON.stringify({
          type: 'mousemove',
          email: session.data?.user?.email,
          name: session.data?.user?.name,
          x: mouseX.current,
          y: mouseY.current,
          roomid: Number(localStorage.getItem('roomid')),
          userid: localStorage.getItem('userid'),
          username: localStorage.getItem('username')
        }))  
        prevMouseX.current = mouseX.current
        prevMouseY.current = mouseY.current
      } 
      
    }, 200)  
    const handleUnload = () => {

      if(socket.current) {
        socket.current.send(JSON.stringify({
          type: 'disconnect',
          userid: localStorage.getItem('userid'),
          roomid: Number(localStorage.getItem('roomid'))
        }))
      }  
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      if(mouseSendEvent.current)
      clearInterval(mouseSendEvent.current)
    }
  }, [])

  


  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if(!ctx || !canvas)return;
    canvas.width = window.innerWidth - 10
    canvas.height = window.innerHeight - 10
    const storedRoomId = localStorage.getItem("roomid") ?? "";
    setRoomId(storedRoomId);
    let isDragging = false
    let rectX = 0, rectY = 0, rectIdx = -1
    let dx = 0, dy = 0

    let lineX = 0, lineY = 0, lineIdx = -1
    let dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0

    let selectedIdx = -1

    let circleX = 0, circleY = 0, circleIdx = -1
    let dxc = 0 , dyc = 0

    let pointX = 0, pointY = 0, pointIdx = -1
    let points: Point[] = []
    let dp: {
      dx: number,
      dy: number
    }[] = []



    let textIdx = -1, dxt = 0, dyt = 0

    let animationFrameId: number;

    
    const drawLineFrame = (e: globalThis.MouseEvent) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      DrawRect()

      ctx.beginPath()
      ctx.strokeStyle = color.current
      ctx.moveTo(lineX, lineY)
      ctx.lineTo(e.clientX, e.clientY)
      ctx.setLineDash([15,10])
      ctx.lineWidth = lineWidth.current
      ctx.setLineDash(lineDash.current)
      ctx.stroke()
    };
    
    const mouseDown = (e: globalThis.MouseEvent) => {
      if(onOptionsPane(e))return;
      if((textIdx = onTextBox(e)) === -1 || cursor.current === 'A')
        isDragging = true
      rectX = e.clientX
      rectY = e.clientY
      lineX = e.clientX
      lineY = e.clientY
      circleX = e.clientX
      circleY = e.clientY
      pointX = e.clientX
      pointY = e.clientY
      if(cursor.current === 'A') {
        if(rectIdx !== -1) {
          const rect = shapes.current[rectIdx]
          if(rect && rect.type === 'rect') {
            oldShape.current = JSON.parse(JSON.stringify(rect))
            dx = rect.x - e.clientX
            dy = rect.y - e.clientY
          }
        } 
        if(lineIdx !== -1) {
          const line = shapes.current[lineIdx]
          if(line && line.type === 'line') {
            oldShape.current = JSON.parse(JSON.stringify(line))
            dx1 = line.startX - e.clientX
            dy1 = line.startY - e.clientY

            dx2 = line.endX - e.clientX
            dy2 = line.endY - e.clientY
          }
        }
        if(circleIdx !== -1) {
          const circle = shapes.current[circleIdx]
          if(circle && circle.type === 'circle') {
            oldShape.current = JSON.parse(JSON.stringify(circle))
            dxc = circle.x - e.clientX
            dyc = circle.y - e.clientY
          }
        }
        if(pointIdx !== -1) {
          const pt = shapes.current[pointIdx]

          if(pt && pt.type === 'path') {
            oldShape.current = JSON.parse(JSON.stringify(pt))
            const point = pt.points ?? []
            dp = []
            for(let i = 0; i < point.length; i++) {
              const p = point[i]
              if(p) {
                dp.push({
                  dx: p.x - e.clientX,
                  dy: p.y - e.clientY
                })
              }
            }
          }
        }
      
        if(textIdx !== -1) {
          const arr: HTMLTextAreaElement[] = Array.from(document.querySelectorAll('#text-box'))
          const text: HTMLTextAreaElement | undefined = arr[textIdx]
          if(!text)return;
          oldleft.current = Number(text.style.left.slice(0, text.style.left.length - 2))
          oldtop.current = Number(text.style.top.slice(0, text.style.top.length - 2))

          oldText.current = text.value
          dxt = text.offsetLeft - e.clientX
          dyt = text.offsetTop - e.clientY
        }
      
        
      }else if(cursor.current === 'T') {
        //if textidx is not equal to -1 then only do this
        textIdx = onTextBox(e)
        if(textIdx !== -1)return;
        const text = document.createElement('textarea')
        text.style.position = 'fixed'
        text.style.left = `${e.clientX}px`
        text.style.top = `${e.clientY}px`
        text.style.border = 'none'
        text.style.outline = 'none'
        text.style.resize = 'both'
        text.style.background = 'transparent'
        text.style.fontSize = `${fontSize.current}px`
        text.style.color = color.current
        text.id = 'text-box'
        text.style.textAlign = textAlign.current
        observeTextArea(text)
        document.body.append(text)
        setTimeout(() => {
          text.focus()
          text.addEventListener('blur', () => {
            const txt = text.value.trim()
            if(!txt) {
              document.body.removeChild(text)
            }
            else {
              const left = Number(text.style.left.slice(0,text.style.left.length-2))
              const top = Number(text.style.top.slice(0,text.style.top.length-2))
              if(socket.current && txt !== oldText.current) {
                socket.current.send(JSON.stringify({
                  type: 'text',
                  roomid: Number(localStorage.getItem('roomid')),
                  userid: localStorage.getItem('userid'),
                  left,
                  top,
                  text: txt
                }))
              }
              text.style.outline = 'none'
              text.readOnly = true
            }
          })
          text.addEventListener('focus', () => {
            text.style.outline = `1px solid #d2d4d6`
          })

          text.addEventListener('dblclick', () => {
            text.readOnly = false
            text.focus()
            setCursorState('A')
            cursor.current = 'A'
          })
          setCursorState('A')
          cursor.current = 'A'
        }, 5)
      }
    }

    const drawRectFrame = (e: globalThis.MouseEvent) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      DrawRect()
      ctx.strokeStyle = color.current
      ctx.lineWidth = lineWidth.current
      ctx.setLineDash(lineDash.current)
      ctx.strokeRect(rectX, rectY, e.clientX - rectX, e.clientY - rectY)
    }

    const mouseMove = (e: globalThis.MouseEvent) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
      if(document.activeElement?.tagName.toLowerCase() === 'textarea') {
        const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
        arr.forEach((obj) => {
          obj.style.cursor = 'text'
        })
      }
      if(isDragging && cursor.current === 'R') {        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => drawRectFrame(e));
      }
      if(isDragging && cursor.current === 'P') {
        points.push({
          x: pointX,
          y: pointY
        })
        const x = e.clientX, y = e.clientY
        ctx.beginPath()
        ctx.moveTo(pointX, pointY)
        ctx.lineTo(x, y)
        ctx.lineWidth = lineWidth.current
        ctx.strokeStyle = color.current
        ctx.setLineDash(lineDash.current)
        ctx.stroke()
        pointX = x
        pointY = y
      }
      if(isDragging && cursor.current === 'C') {
        const mx = ( e.clientX + circleX ) / 2
        const my = ( e.clientY + circleY ) / 2

        const dist = (mx-circleX)*(mx-circleX) + (my-circleY)*(my-circleY)
        const r = Math.sqrt(dist)
    
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        DrawRect()
        ctx.beginPath()
        ctx.lineWidth = lineWidth.current
        ctx.strokeStyle = color.current
        ctx.setLineDash(lineDash.current)
        ctx.arc(mx, my, r, 0, 2*Math.PI)
        ctx.stroke()
      }
      if(cursor.current === 'A') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        DrawRect()
        
        if(isDragging) {
          const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
          arr.forEach((obj) => {
            obj.style.cursor = 'all-scroll'
          })
          if(rectIdx !== -1) {
            if(textIdx !== -1)return;
            const rect = shapes.current[rectIdx]
            if(rect && rect.type === 'rect') {
              rect.x = dx + e.clientX
              rect.y = dy + e.clientY
              DrawRect()
            }
          }
          else if(lineIdx !== -1) {
            if(textIdx !== -1)return;
            const line = shapes.current[lineIdx]
            if(line && line.type === 'line') {
              line.startX = dx1 + e.clientX
              line.startY = dy1 + e.clientY

              line.endX = dx2 + e.clientX
              line.endY = dy2 + e.clientY
              DrawRect()
            }
          }
          else if(circleIdx !== -1) {
            if(textIdx !== -1)return;
            const circle = shapes.current[circleIdx]
            if(circle && circle.type === 'circle') {
              circle.x = dxc + e.clientX
              circle.y = dyc + e.clientY

              DrawRect()
            }
          }
          else if(pointIdx !== -1) {
            if(textIdx !== -1)return;
            const pt = shapes.current[pointIdx]
            if(pt && pt.type === 'path') {
              const point = pt.points
              for(let i = 0; i < point.length; i++) {
                const p = point[i], q = dp[i]
                if(p && q) {
                  p.x = q.dx + e.clientX
                  p.y = q.dy + e.clientY

                }
              }
            }
            DrawRect()
          }
          else if(textIdx !== -1 && valid.current === true) {
            const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
            const text = arr[textIdx]
            if(!text)return
            const xt = dxt + e.clientX, yt = dyt + e.clientY

            text.style.left = `${xt}px`
            text.style.top = `${yt}px`
          }
        }
        else {
          textIdx = onTextBox(e)
          const isTextFocused = document.activeElement?.tagName.toLowerCase() === 'textarea'

          if (
            (rectIdx = onRectangle(e)) !== -1 ||
            (lineIdx = onLine(e)) !== -1 ||
            (circleIdx = onCircle(e)) !== -1 ||
            (pointIdx = OnPath(e)) !== -1 ||
            (textIdx !== -1)
          ) {
            const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
            arr.forEach((obj, index) => {
              if (index === textIdx) {
                obj.style.cursor = isTextFocused && cursor.current !== 'A' ? 'text' : 'all-scroll'
              }
            })
            document.body.style.cursor = isTextFocused ? 'default' : 'all-scroll'
          } else {
            document.body.style.cursor = 'default'
          }
          

        }
        
      }
      if(isDragging && cursor.current === 'L') {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => drawLineFrame(e));
      
      }     
      
      if(document.activeElement?.tagName.toLowerCase() === 'textarea') {
        const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
        arr.forEach((obj) => {
          obj.style.cursor = 'text'
        })
      }   
    }

    const mouseUp = (e: globalThis.MouseEvent) => {
      if(isDragging) {

        if(cursor.current === 'R') {
            const obj: Rectangle = {
              type: "rect",
              x: rectX,
              y: rectY,
              width: e.clientX - rectX,
              height: e.clientY - rectY,
              color: color.current,
              lineWidth: lineWidth.current,
              lineDash: lineDash.current
            }
            shapes.current.push(obj)
            if(socket.current && obj.width !== 0 && obj.height !== 0) {
              socket.current.send(JSON.stringify({
                type: 'rect',
                roomid: Number(localStorage.getItem('roomid')),
                data: obj,
                userid: localStorage.getItem('userid')
              }))
            }
            setCursorState('A')
            cursor.current = 'A'
            DrawRect()
        }
        else if(cursor.current === 'A') {
          if(rectIdx !== -1) {
            const ptt = shapes.current[rectIdx]
            if(ptt) {
              newShape.current = ptt
            }
            selectedIdx = rectIdx
          }
          else if(lineIdx !== -1) {
            const ptt = shapes.current[lineIdx]
            if(ptt)
              newShape.current = ptt
            selectedIdx = lineIdx
          }
          else if(circleIdx !== -1) {
            const ptt = shapes.current[circleIdx]
            if(ptt)
              newShape.current = ptt
            selectedIdx = circleIdx 
          }
          else if(pointIdx !== -1) {
            const ptt = shapes.current[pointIdx]
            if(ptt)
              newShape.current = ptt
            selectedIdx = pointIdx
          }
          rectIdx = -1
          lineIdx = -1
          circleIdx = -1
          pointIdx = -1

          if(JSON.stringify(oldShape.current) !== JSON.stringify(newShape.current)) {
            if(socket.current) {
              socket.current.send(JSON.stringify({
                type: 'move',
                roomid: Number(localStorage.getItem('roomid')),
                userid: localStorage.getItem('userid'),
                oldshape: oldShape.current,
                newshape: newShape.current
              }))
            }
          }

          if(textIdx !== -1) {
            const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
            const text = arr[textIdx]
            if(!text)return;
            const left = Number(text.style.left.slice(0,text.style.left.length-2))
            const top = Number(text.style.top.slice(0,text.style.top.length-2))

            if((oldleft.current !== left && oldleft.current !== -1) || (oldtop.current !== top && oldtop.current !== -1)) {
              if(socket.current) {
                socket.current.send(JSON.stringify({
                  type: 'textmove',
                  roomid: Number(localStorage.getItem('roomid')),
                  userid: localStorage.getItem('userid'),
                  oldleft: oldleft.current,
                  oldtop: oldtop.current,
                  newleft: left,
                  newtop: top
                }))
              }
            }
          }

          


        }
        else if(cursor.current === 'L') {
          const obj: Line = {
            type: "line",
            startX: lineX,
            startY: lineY,
            endX: e.clientX,
            endY: e.clientY,
            color: color.current,
            lineWidth: lineWidth.current,
            lineDash: lineDash.current
          }
          shapes.current.push(obj)
          if(socket.current) {
            socket.current.send(JSON.stringify({
              type: 'line',
              roomid: Number(localStorage.getItem('roomid')),
              data: obj,
              userid: localStorage.getItem('userid')
            }))
          }
          setCursorState('A')
            cursor.current = 'A'
          DrawRect()
        }
        else if(cursor.current === 'C') {
          const mx = ( e.clientX + circleX ) / 2
          const my = ( e.clientY + circleY ) / 2


          const dist = (mx-circleX)*(mx-circleX) + (my-circleY)*(my-circleY)
          const r = Math.sqrt(dist)
          const obj: Circle = {
            type: "circle",
            x: mx,
            y: my,
            r,
            color: color.current,
            lineWidth: lineWidth.current,
            lineDash: lineDash.current
          }
          shapes.current.push(obj)
          if(socket.current) {
            socket.current.send(JSON.stringify({
              type: 'circle',
              roomid: Number(localStorage.getItem('roomid')),
              data: obj,
              userid: localStorage.getItem('userid')
            }))
          }
          setCursorState('A')
            cursor.current = 'A'
          DrawRect()
        }
        else if(cursor.current === 'P') {
          if(points.length > 0) {
            const obj: Path = {
              type: "path",
              points: points,
              color: color.current,
              lineWidth: lineWidth.current,
              lineDash: lineDash.current
            }
            shapes.current.push(obj)
            if(socket.current) {
              socket.current.send(JSON.stringify({
                type: 'path',
                roomid: Number(localStorage.getItem('roomid')),
                data: obj,
                userid: localStorage.getItem('userid')
              }))
            }
            points = []
            dp = []
            setCursorState('A')
            cursor.current = 'A'
            DrawRect()

          }
        }

      }
      isDragging = false
    }



    document.addEventListener("mousedown", mouseDown)
    document.addEventListener("mousemove", mouseMove)
    document.addEventListener("mouseup", mouseUp)
    document.addEventListener("keydown", (e) => {
      if(e.key === 'Delete' && cursor.current === 'A') {
        if(selectedIdx !== -1) {
          let delObj;
          shapes.current.forEach((obj, index) => {
            if(index === selectedIdx)
              delObj = obj
          })
          if(socket.current) {
            socket.current.send(JSON.stringify({
              type: 'delete',
              roomid: Number(localStorage.getItem('roomid')),
              data: delObj,
              userid: localStorage.getItem('userid')
            }))
          }
          const updated = shapes.current.filter((obj, index) => index !== selectedIdx)
          shapes.current = updated
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          DrawRect()
          selectedIdx = -1
        }
        else if(textIdx !== -1) {
          const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
          const text = arr[textIdx]
          if(!text)return;
          const left = Number(text.style.left.slice(0,text.style.left.length-2))
          const top = Number(text.style.top.slice(0,text.style.top.length-2))
          if(socket.current) {
            socket.current.send(JSON.stringify({
              type: 'deltext',
              roomid: Number(localStorage.getItem('roomid')),
              userid: localStorage.getItem('userid'),
              left,
              top
            }))
          }
          document.body.removeChild(text)
          textIdx = -1
        }
      }
    })

    return () => {
      document.removeEventListener("mousedown", mouseDown)
      document.removeEventListener("mouseup", mouseUp)
      document.removeEventListener("mousemove", mouseMove)
      cancelAnimationFrame(animationFrameId); 
    }

  }, [session.status])

  if(!session) {
        setTimeout(() => {
            router.push("/")
        }, 3000)
        return (
            <div className="flex justify-center items-center w-full h-screen text-center">
                <p className = "my-4 text-lg text-gray-500">User not authenticated <br />Redirecting...</p>

            </div>
        );
    }
    else if(session.status === 'loading') {
        return (
            <div role="status" className = "w-full h-screen flex justify-center items-center">
            <svg aria-hidden="true" className = "w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className = "sr-only">Loading...</span>
        </div>
        )
    }
    else if(session.status === 'unauthenticated') {
        window.setTimeout(() => {
            router.push("/")
        }, 3000)
        return (
            <div className="flex justify-center items-center w-full h-screen text-center">
                <p className = "my-4 text-lg text-gray-500">User not authenticated <br />Redirecting...</p>

            </div>
        );
    }
  else {
    
    return (
      <div className="w-full" id="main">
        <ProfileDropdown session={session.data} room={true} roomID={roomId ?? ''}/>
        <canvas ref={ref}></canvas>
        {(cursor.current !== 'A' && cursor.current !== 'T') ? <div className="flex flex-col p-3 gap-y-2 fixed left-2 top-1/2 transform -translate-y-1/2 shadow-sm shadow-gray-400 rounded-lg bg-white Z-50" id='options'>
        <div>
          <HeadingCustom str="Stroke"/>
          <div className="flex justify-center items-center gap-x-1 bg-white">
            <button className={`w-7 h-7 p-1 bg-black rounded-lg ${C === "black" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'black'
              setC("black")
            }}></button>
            <button className={`w-7 h-7 p-1 bg-red-500 rounded-lg ${C === "red" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'red'
              setC("red")
            }}></button>
            <button className={`w-7 h-7 bg-green-500 rounded-lg ${C === "green" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'green'
              setC("green")
            }}></button>
            
            <button className={`w-7 h-7 bg-blue-600 rounded-lg ${C === "blue" ? "border-1 border-y-black" : ''}`} onClick={() =>  {
              color.current = 'blue'
              setC("blue")
            }}></button>

            <button className={`w-7 h-7 bg-orange-600 rounded-lg ${C === "orange" ? "border-1 border-y-black" : ''}`} onClick={() =>  {
              color.current = 'orange'
              setC("orange")
            }}></button>

          </div>

        </div>
        <div>
          <HeadingCustom str="Stroke Width"/>
          <div className="flex justify-start items-center gap-x-2">
            
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${L === 1 ? "bg-blue-200 rounded-lg": ""}`} transform="rotate(90)" onClick={() =>  {
              lineWidth.current = 1
              setL(1)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Line_L"> <path id="Vector" d="M12 19V5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>

            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${L === 2 ? "bg-blue-200 rounded-lg": ""}`} transform="rotate(90)" onClick={() =>  {
              lineWidth.current = 2
              setL(2)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Line_L"> <path id="Vector" d="M12 19V5" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>

            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${L === 5 ? "bg-blue-200 rounded-lg": ""}`} transform="rotate(90)" onClick={() =>  {
              lineWidth.current = 5
              setL(5)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Line_L"> <path id="Vector" d="M12 19V5" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>
            
            
            
            
            
            

          </div>

        </div>
        <div>
          <HeadingCustom str="Stroke Style"/>
          <div className="flex justify-start items-center gap-x-2">

            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${LD === 1 ? "bg-blue-200 rounded-lg": ""}`} transform="rotate(90)" onClick={() =>  {
              lineDash.current = []
              setLD(1)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Line_L"> <path id="Vector" d="M12 19V5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>

            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000" className={`w-8 h-8 p-1.5 ${LD === 2 ? "bg-blue-200 rounded-lg": ""}`} onClick={() =>  {
              lineDash.current = [15, 10]
              setLD(2)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M6 13H1v-2h5zm6-2H7v2h5zm6 0h-5v2h5zm6 0h-5v2h5z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>


            <svg width="20px" height="256px" viewBox="0 0 24 24" className={`w-8 h-8 p-1.5 ${LD === 5 ? "bg-blue-200 rounded-lg": ""}`} xmlns="http://www.w3.org/2000/svg" fill="#000000" onClick={() =>  {
              lineDash.current = [6, 10]
              setLD(5)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M3 13H1v-2h2zm4-2H5v2h2zm12 0h-2v2h2zm4 0h-2v2h2zm-12 0H9v2h2zm4 0h-2v2h2z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>


          </div>

        </div>

        </div>: ''}
        {(cursor.current === 'T') ? <div className="flex flex-col p-3 gap-y-2 fixed left-2 top-1/2 transform -translate-y-1/2 shadow-sm shadow-gray-400 rounded-lg bg-white Z-50" id='options'>
        <div>
          <HeadingCustom str="Stroke"/>
          <div className="flex justify-center items-center gap-x-1 bg-white">
            <button className={`w-7 h-7 p-1 bg-black rounded-lg ${C === "black" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'black'
              setC("black")
            }}></button>
            <button className={`w-7 h-7 p-1 bg-red-500 rounded-lg ${C === "red" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'red'
              setC("red")
            }}></button>
            <button className={`w-7 h-7 bg-green-500 rounded-lg ${C === "green" ? "border-1 border-black" : ''}`} onClick={() =>  {
              color.current = 'green'
              setC("green")
            }}></button>
            
            <button className={`w-7 h-7 bg-blue-600 rounded-lg ${C === "blue" ? "border-1 border-y-black" : ''}`} onClick={() =>  {
              color.current = 'blue'
              setC("blue")
            }}></button>

            <button className={`w-7 h-7 bg-orange-600 rounded-lg ${C === "orange" ? "border-1 border-y-black" : ''}`} onClick={() =>  {
              color.current = 'orange'
              setC("orange")
            }}></button>

          </div>

        </div>
        <div>
          <HeadingCustom str="Font Size"/>
          <div className="flex justify-start items-center gap-x-2">
            <button className={`w-8 h-8 p-1 text-lg rounded-lg flex justify-center items-center ${F === 1 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 20
              setF(1)
            }}>S</button>
            <button className={`w-8 h-8 p-1 text-lg rounded-lg flex justify-center items-center ${F === 2 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 30
              setF(2)
            }}>M</button>
            <button className={`w-8 h-8 p-1 text-lg rounded-lg flex justify-center items-center ${F === 3 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 40
              setF(3)
            }}>L</button>
            <button className={`w-8 h-8 p-1 text-lg rounded-lg  flex justify-center items-center ${F === 4 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 50
              setF(4)
            }}>XL</button>

          </div>

        </div>
        <div>
          <HeadingCustom str="Text Align"/>
          <div className="flex justify-start items-center gap-x-2">
            <svg viewBox="0 0 24 24" className={`w-8 h-8 p-1.5 ${T === 1 ? "bg-blue-200 rounded-lg": ""}`} fill="none" xmlns="http://www.w3.org/2000/svg" onClick={() =>  {
              textAlign.current = 'left'
              setT(1)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Edit / Text_Align_Left"> <path id="Vector" d="M4 18H14M4 14H20M4 10H14M4 6H20" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>

            
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${T === 2 ? "bg-blue-200 rounded-lg": ""}`} onClick={() =>  {
              textAlign.current = 'center'
              setT(2)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Edit / Text_Align_Center"> <path id="Vector" d="M17 18H7M20 14H4M17 10H7M20 6H4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>


            <svg viewBox="0 0 24 24" transform="matrix(-1, 0, 0, 1, 0, 0)" className={`w-8 h-8 p-1.5 ${T === 3 ? "bg-blue-200 rounded-lg": ""}`} fill="none" xmlns="http://www.w3.org/2000/svg" onClick={() =>  {
              textAlign.current = 'right'
              setT(3)
            }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Edit / Text_Align_Left"> <path id="Vector" d="M4 18H14M4 14H20M4 10H14M4 6H20" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>

          </div>

        </div>

        </div>: ''}

        

        <div className="flex p-0.5 gap-x-0.5 fixed top-6 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-sm shadow-gray-300 border-gray-400 rounded-lg bg-white self-center" id='options2'>
          <svg className={`w-8 h-8 p-1 ${cursorState === 'A' ? "bg-blue-200 rounded-lg": ""}`} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-5.0 -10.0 110.0 135.0" onClick={() =>  {
            cursor.current = 'A'
            setCursorState("A")
          }}>
          <path d="m81.457 54.84-20.758 6.918 13.359 23.148c0.80078 1.3789 0.32422 3.1367-1.0547 3.9375l-10 5.7656c-1.3789 0.80078-3.1367 0.33594-3.9375-1.0547l-13.355-23.148-16.367 14.527c-1.3789 1.2227-3.5703 0.39453-3.7812-1.4492l-8.5664-75.938c-0.22656-1.9844 2.0117-3.2773 3.6289-2.0938l61.469 45.395c1.4883 1.0938 1.1211 3.4141-0.63672 3.9922z"/>
          </svg>
          <svg className={`w-8 h-8 p-1.5 ${cursorState === 'R' ? "bg-blue-200 rounded-lg": ""}`} fill="#000000" version="1.1" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 0.5 42 42" onClick={() =>  {
            cursor.current = 'R'
            setCursorState("R")
          }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M0.5,4.5v33h40v-33H0.5z M3.5,7.5h34v27h-34V7.5z"></path> </g></svg>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${cursorState === 'L' ? "bg-blue-200 rounded-lg": ""}`} transform="rotate(90)" onClick={() =>  {
            cursor.current = 'L'
            setCursorState("L")
          }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Line_L"> <path id="Vector" d="M12 19V5" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"></path> </g> </g></svg>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1.5 ${cursorState === 'C' ? "bg-blue-200 rounded-lg": ""}`} onClick={() =>  {
            cursor.current = 'C'
            setCursorState("C")
          }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>

          <svg width="256px" height="256px" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 p-1 ${cursorState === 'P' ? "bg-blue-200 rounded-lg": ""}`} onClick={() =>  {
            cursor.current = 'P'
            setCursorState("P")
          }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M13.2942 7.95881C13.5533 7.63559 13.5013 7.16358 13.178 6.90453C12.8548 6.64549 12.3828 6.6975 12.1238 7.02072L13.2942 7.95881ZM6.811 14.8488L7.37903 15.3385C7.38489 15.3317 7.39062 15.3248 7.39623 15.3178L6.811 14.8488ZM6.64 15.2668L5.89146 15.2179L5.8908 15.2321L6.64 15.2668ZM6.5 18.2898L5.7508 18.2551C5.74908 18.2923 5.75013 18.3296 5.75396 18.3667L6.5 18.2898ZM7.287 18.9768L7.31152 19.7264C7.36154 19.7247 7.41126 19.7181 7.45996 19.7065L7.287 18.9768ZM10.287 18.2658L10.46 18.9956L10.4716 18.9927L10.287 18.2658ZM10.672 18.0218L11.2506 18.4991L11.2571 18.491L10.672 18.0218ZM17.2971 10.959C17.5562 10.6358 17.5043 10.1638 17.1812 9.90466C16.8581 9.64552 16.386 9.69742 16.1269 10.0206L17.2971 10.959ZM12.1269 7.02052C11.8678 7.34365 11.9196 7.81568 12.2428 8.07484C12.5659 8.33399 13.0379 8.28213 13.2971 7.95901L12.1269 7.02052ZM14.3 5.50976L14.8851 5.97901C14.8949 5.96672 14.9044 5.95412 14.9135 5.94123L14.3 5.50976ZM15.929 5.18976L16.4088 4.61332C16.3849 4.59344 16.3598 4.57507 16.3337 4.5583L15.929 5.18976ZM18.166 7.05176L18.6968 6.52192C18.6805 6.50561 18.6635 6.49007 18.6458 6.47532L18.166 7.05176ZM18.5029 7.87264L19.2529 7.87676V7.87676L18.5029 7.87264ZM18.157 8.68976L17.632 8.15412C17.6108 8.17496 17.5908 8.19704 17.5721 8.22025L18.157 8.68976ZM16.1271 10.0203C15.8678 10.3433 15.9195 10.8153 16.2425 11.0746C16.5655 11.3339 17.0376 11.2823 17.2969 10.9593L16.1271 10.0203ZM13.4537 7.37862C13.3923 6.96898 13.0105 6.68666 12.6009 6.74805C12.1912 6.80943 11.9089 7.19127 11.9703 7.60091L13.4537 7.37862ZM16.813 11.2329C17.2234 11.1772 17.5109 10.7992 17.4552 10.3888C17.3994 9.97834 17.0215 9.69082 16.611 9.74659L16.813 11.2329ZM12.1238 7.02072L6.22577 14.3797L7.39623 15.3178L13.2942 7.95881L12.1238 7.02072ZM6.24297 14.359C6.03561 14.5995 5.91226 14.9011 5.89159 15.218L7.38841 15.3156C7.38786 15.324 7.38457 15.3321 7.37903 15.3385L6.24297 14.359ZM5.8908 15.2321L5.7508 18.2551L7.2492 18.3245L7.3892 15.3015L5.8908 15.2321ZM5.75396 18.3667C5.83563 19.1586 6.51588 19.7524 7.31152 19.7264L7.26248 18.2272C7.25928 18.2273 7.25771 18.2268 7.25669 18.2264C7.25526 18.2259 7.25337 18.2249 7.25144 18.2232C7.2495 18.2215 7.24825 18.2198 7.24754 18.2185C7.24703 18.2175 7.24637 18.216 7.24604 18.2128L5.75396 18.3667ZM7.45996 19.7065L10.46 18.9955L10.114 17.536L7.11404 18.247L7.45996 19.7065ZM10.4716 18.9927C10.7771 18.9151 11.05 18.7422 11.2506 18.499L10.0934 17.5445C10.0958 17.5417 10.0989 17.5397 10.1024 17.5388L10.4716 18.9927ZM11.2571 18.491L17.2971 10.959L16.1269 10.0206L10.0869 17.5526L11.2571 18.491ZM13.2971 7.95901L14.8851 5.97901L13.7149 5.04052L12.1269 7.02052L13.2971 7.95901ZM14.9135 5.94123C15.0521 5.74411 15.3214 5.6912 15.5243 5.82123L16.3337 4.5583C15.4544 3.99484 14.2873 4.2241 13.6865 5.0783L14.9135 5.94123ZM15.4492 5.7662L17.6862 7.6282L18.6458 6.47532L16.4088 4.61332L15.4492 5.7662ZM17.6352 7.58161C17.7111 7.6577 17.7535 7.761 17.7529 7.86852L19.2529 7.87676C19.2557 7.36905 19.0555 6.88127 18.6968 6.52192L17.6352 7.58161ZM17.7529 7.86852C17.7524 7.97604 17.7088 8.07886 17.632 8.15412L18.682 9.22541C19.0446 8.87002 19.2501 8.38447 19.2529 7.87676L17.7529 7.86852ZM17.5721 8.22025L16.1271 10.0203L17.2969 10.9593L18.7419 9.15928L17.5721 8.22025ZM11.9703 7.60091C12.3196 9.93221 14.4771 11.5503 16.813 11.2329L16.611 9.74659C15.0881 9.95352 13.6815 8.89855 13.4537 7.37862L11.9703 7.60091Z" fill="#000000"></path> </g></svg>
          <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" className={`w-8 h-8 p-1 ${cursorState === 'T' ? "bg-blue-200 rounded-lg": ""}`} fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" onClick={() =>  {
            cursor.current = 'T'
            setCursorState("T")
          }}><g strokeWidth="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="20" x2="7" y2="20"></line><line x1="14" y1="20" x2="21" y2="20"></line><line x1="6.9" y1="15" x2="13.8" y2="15"></line><line x1="10.2" y1="6.3" x2="16" y2="20"></line><polyline points="5 20 11 4 13 4 20 20"></polyline></g></svg>


          
        
        </div>
        {/* <div id="cursor">
        <div className="flex flex-col justify-center w-10 fixed top-10 left-10" id='ujjwal@gmail.com'>
          <svg width="30px" height="30px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" aria-labelledby="cursorIconTitle" stroke="#6986b8" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" fill="none" color="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><polygon points="7 20 7 4 19 16 12 16 7 21"></polygon> </g></svg>
          <p style={{fontSize:"10px",color:"#6986b8  "}} className="self-end">Ujjwal</p>
        </div>

        </div> */}
      </div>
      
    
    )
  }

  
}


function HeadingCustom({str}: {str: string}) {
  return (
    <h2 className="text-base">{str}</h2>
    // <p className="text-sm text-gray-950">{str}</p>
  )
}