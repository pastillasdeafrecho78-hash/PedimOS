-- CreateEnum
CREATE TYPE "IntegrationScope" AS ENUM ('orders_create', 'orders_read');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('EXTERNAL_API', 'STAFF_DASHBOARD', 'PUBLIC_LINK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'SERVIDO', 'PAGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Restaurante" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSuspended" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracionApiKey" (
  "id" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "scopes" "IntegrationScope"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegracionApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
  "id" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tamano" (
  "id" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Tamano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modificador" (
  "id" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Modificador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "externalOrderId" TEXT NOT NULL,
  "tipoPedido" TEXT NOT NULL,
  "canal" TEXT NOT NULL,
  "origen" "OrderChannel" NOT NULL,
  "numeroComanda" INTEGER NOT NULL,
  "estado" "OrderStatus" NOT NULL DEFAULT 'PENDIENTE',
  "notas" TEXT,
  "deliveryMode" TEXT,
  "driverRef" TEXT,
  "vehicleNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productoId" TEXT NOT NULL,
  "tamanoId" TEXT,
  "cantidad" INTEGER NOT NULL,
  "notas" TEXT,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIdempotencyKey" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "restauranteId" TEXT NOT NULL,
  "apiKeyId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurante_slug_key" ON "Restaurante"("slug");
CREATE UNIQUE INDEX "IntegracionApiKey_keyHash_key" ON "IntegracionApiKey"("keyHash");
CREATE INDEX "IntegracionApiKey_restauranteId_idx" ON "IntegracionApiKey"("restauranteId");
CREATE INDEX "Producto_restauranteId_idx" ON "Producto"("restauranteId");
CREATE INDEX "Tamano_restauranteId_idx" ON "Tamano"("restauranteId");
CREATE INDEX "Modificador_restauranteId_idx" ON "Modificador"("restauranteId");
CREATE UNIQUE INDEX "Order_restauranteId_externalOrderId_key" ON "Order"("restauranteId", "externalOrderId");
CREATE INDEX "Order_restauranteId_idx" ON "Order"("restauranteId");
CREATE UNIQUE INDEX "ExternalIdempotencyKey_idempotencyKey_restauranteId_key" ON "ExternalIdempotencyKey"("idempotencyKey", "restauranteId");
CREATE INDEX "ExternalIdempotencyKey_restauranteId_idx" ON "ExternalIdempotencyKey"("restauranteId");

-- AddForeignKey
ALTER TABLE "IntegracionApiKey" ADD CONSTRAINT "IntegracionApiKey_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tamano" ADD CONSTRAINT "Tamano_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Modificador" ADD CONSTRAINT "Modificador_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_tamanoId_fkey" FOREIGN KEY ("tamanoId") REFERENCES "Tamano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalIdempotencyKey" ADD CONSTRAINT "ExternalIdempotencyKey_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "IntegracionApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
