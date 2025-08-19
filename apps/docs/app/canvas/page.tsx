"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {  useEffect, useRef, useState } from "react";
import ProfileDropdown from "../components/index";
import { Crimson_Text } from "next/font/google";



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
  const router = useRouter()
  const session = useSession()
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
        console.log('connection from client ok sending connect')
        if(ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'connect',
            roomid: Number(localStorage.getItem('roomid'))
          }))
          socket.current = ws
        }
      }
      ws.onmessage = (msg) => {
        const store = JSON.parse(JSON.stringify(shapes.current))
        const parsed = JSON.parse(msg.data)
        console.log("message received - ", parsed)
        console.log('old shape', store)
        if(parsed.type === 'delete') {
          const shapesUpdates = shapes.current.filter((obj) => JSON.stringify(obj) !== JSON.stringify(parsed.data))
          shapes.current = shapesUpdates
          const canvas = ref.current
          const ctx = canvas?.getContext("2d")
          if(!ctx || !canvas)return;
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          DrawRect()
        }
        else {
          shapes.current.push(JSON.parse(msg.data))
          DrawRect()

        }
        console.log("new shapes - ", shapes.current)
      }
      ws.onclose = () => {
        router.push("/")
      }
      
      
    }

  }, [session, session.status])

  

  


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
            dx = rect.x - e.clientX
            dy = rect.y - e.clientY
          }
        } 
        if(lineIdx !== -1) {
          const line = shapes.current[lineIdx]
          if(line && line.type === 'line') {
            dx1 = line.startX - e.clientX
            dy1 = line.startY - e.clientY

            dx2 = line.endX - e.clientX
            dy2 = line.endY - e.clientY
          }
        }
        if(circleIdx !== -1) {
          const circle = shapes.current[circleIdx]
          if(circle && circle.type === 'circle') {
            dxc = circle.x - e.clientX
            dyc = circle.y - e.clientY
          }
        }
        if(pointIdx !== -1) {
          const pt = shapes.current[pointIdx]

          if(pt && pt.type === 'path') {
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
          const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
          const text: HTMLElement | undefined = arr[textIdx]
          if(!text)return;
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
        document.body.append(text)
        setTimeout(() => {
          text.focus()
          text.addEventListener('blur', () => {
            const txt = text.value.trim()
            if(!txt) {
              document.body.removeChild(text)
            }
            else {
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

        // console.log(circleX+" "+circleY)
        // console.log(mx+" "+my)

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
          else if(textIdx !== -1) {
            const arr: HTMLElement[] = Array.from(document.querySelectorAll('#text-box'))
            const text = arr[textIdx]
            if(!text)return
            document.body.removeChild(text)
            const xt = dxt + e.clientX, yt = dyt + e.clientY

            text.style.left = `${xt}px`
            text.style.top = `${yt}px`
            document.body.appendChild(text)
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
          

          // console.log(lineIdx, rectIdx)
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
              console.log('sending strokes')
              socket.current.send(JSON.stringify({
                type: 'rect',
                roomid: Number(localStorage.getItem('roomid')),
                data: obj
              }))
            }
            DrawRect()
        }
        else if(cursor.current === 'A') {
          if(rectIdx !== -1)
              selectedIdx = rectIdx
          else if(lineIdx !== -1)
            selectedIdx = lineIdx
          else if(circleIdx !== -1)
            selectedIdx = circleIdx 
          else
            selectedIdx = pointIdx
          rectIdx = -1
          lineIdx = -1
          circleIdx = -1
          pointIdx = -1
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
            console.log('sending strokes')
            socket.current.send(JSON.stringify({
              type: 'line',
              roomid: Number(localStorage.getItem('roomid')),
              data: obj
            }))
          }
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
            console.log('sending strokes')
            socket.current.send(JSON.stringify({
              type: 'circle',
              roomid: Number(localStorage.getItem('roomid')),
              data: obj
            }))
          }
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
              console.log('sending strokes')
              socket.current.send(JSON.stringify({
                type: 'path',
                roomid: Number(localStorage.getItem('roomid')),
                data: obj
              }))
            }
            console.log(JSON.parse(JSON.stringify(obj)))
            points = []
            dp = []
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
          console.log("delete objext", delObj)
          if(socket.current) {
            console.log('sending command to delete from client')
            socket.current.send(JSON.stringify({
              type: 'delete',
              roomid: Number(localStorage.getItem('roomid')),
              data: delObj
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
      <div className="w-full">
        <ProfileDropdown session={session.data} room={true} roomID={roomId ?? ''}/>
        <canvas ref={ref}></canvas>
        {(cursor.current !== 'A' && cursor.current !== 'T') ? <div className="flex flex-col p-1 gap-y-0.5 fixed left-0 top-1/2 transform -translate-y-1/2 border-1 border-gray-400 rounded-lg bg-white Z-50" id='options'>
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
          <HeadingCustom str="Stroke Width"/>
          <div className="flex justify-start items-center gap-x-1">
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${L === 1 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineWidth.current = 1
              setL(1)
            }}>1</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${L === 2 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineWidth.current = 2
              setL(2)
            }}>2</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${L === 5 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineWidth.current = 5
              setL(5)
            }}>5</button>

          </div>

          <HeadingCustom str="Stroke Style"/>
          <div className="flex justify-start items-center gap-x-1">
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${LD === 1 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineDash.current = []
              setLD(1)
            }}>1</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${LD === 2 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineDash.current = [15, 10]
              setLD(2)
            }}>2</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${LD === 5 ? "bg-blue-200" : ''}`} onClick={() =>  {
              lineDash.current = [6, 10]
              setLD(5)
            }}>5</button>

          </div>
        </div>: ''}
        {(cursor.current === 'T') ? <div className="flex flex-col p-1 gap-y-0.5 fixed left-0 top-1/2 transform -translate-y-1/2 border-1 border-gray-400 rounded-lg bg-white Z-50" id='options'>
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
          <HeadingCustom str="Font Size"/>
          <div className="flex justify-start items-center gap-x-1">
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${F === 1 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 20
              setF(1)
            }}>S</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${F === 2 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 30
              setF(2)
            }}>M</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${F === 3 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 40
              setF(3)
            }}>L</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${F === 4 ? "bg-blue-200" : ''}`} onClick={() =>  {
              fontSize.current = 50
              setF(4)
            }}>XL</button>

          </div>

          <HeadingCustom str="Text Align"/>
          <div className="flex justify-start items-center gap-x-1">
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${T === 1 ? "bg-blue-200" : ''}`} onClick={() =>  {
              textAlign.current = 'left'
              setT(1)
            }}>L</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${T === 2 ? "bg-blue-200" : ''}`} onClick={() =>  {
              textAlign.current = 'center'
              setT(2)
            }}>C</button>
            <button className={`w-7 h-7 p-1 rounded-lg border-1 flex justify-center items-center ${T === 3 ? "bg-blue-200" : ''}`} onClick={() =>  {
              textAlign.current = 'right'
              setT(3)
            }}>R</button>

          </div>
        </div>: ''}

        

        <div className="flex p-0.5 gap-x-0.5 fixed top-5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-1 border-gray-400 rounded-lg bg-white self-center" id='options2'>
          
          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'A' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'A'
            setCursorState("A")
          
          }}>A</button>
          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'R' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'R'
            setCursorState("R")
          }}>R</button>

          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'L' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'L'
            setCursorState("L")
          }}>L</button>

          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'C' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'C'
            setCursorState("C")
          }}>C</button>

          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'P' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'P'
            setCursorState("P")
          }}>P</button>

          <button className={`w-8 h-8 rounded-lg border-1 border-y-black ${cursorState === 'T' ? "bg-blue-300" : ''}`} onClick={() =>  {
            cursor.current = 'T'
            setCursorState("T")
          }}>T</button>

          
        
        </div>
      </div>
      
    
    )
  }

  
}


function HeadingCustom({str}: {str: string}) {
  return (
    <p className="text-sm">{str}</p>
  )
}