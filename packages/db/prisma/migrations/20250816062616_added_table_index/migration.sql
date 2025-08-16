-- CreateTable
CREATE TABLE "public"."Rectangle" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rect',
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "lineWidth" INTEGER NOT NULL,
    "lineDash" INTEGER[],
    "color" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Line" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'line',
    "startX" INTEGER NOT NULL,
    "startY" INTEGER NOT NULL,
    "endX" INTEGER NOT NULL,
    "endY" INTEGER NOT NULL,
    "lineWidth" INTEGER NOT NULL,
    "lineDash" INTEGER[],
    "color" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Circle" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'circle',
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "r" INTEGER NOT NULL,
    "lineWidth" INTEGER NOT NULL,
    "lineDash" INTEGER[],
    "color" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Path" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'path',
    "points" INTEGER[],
    "lineWidth" INTEGER NOT NULL,
    "lineDash" INTEGER[],
    "color" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Rectangle_id_key" ON "public"."Rectangle"("id");

-- CreateIndex
CREATE INDEX "Rectangle_roomId_idx" ON "public"."Rectangle"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Line_id_key" ON "public"."Line"("id");

-- CreateIndex
CREATE INDEX "Line_roomId_idx" ON "public"."Line"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Circle_id_key" ON "public"."Circle"("id");

-- CreateIndex
CREATE INDEX "Circle_roomId_idx" ON "public"."Circle"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Path_id_key" ON "public"."Path"("id");

-- CreateIndex
CREATE INDEX "Path_roomId_idx" ON "public"."Path"("roomId");
