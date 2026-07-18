import fs from 'fs';
const text = `
model DespachoImportacion {
  id              Int       @id @default(autoincrement())
  empresaId       Int
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  numeroDespacho  String
  fechaArribo     DateTime?
  estado          String    @default("en_transito")
  incoterm        String    @default("FOB")
  valorFobTotal   Decimal   @default(0) @db.Decimal(15, 2)
  fleteUsd        Decimal   @default(0) @db.Decimal(15, 2)
  seguroUsd       Decimal   @default(0) @db.Decimal(15, 2)
  arancelesArs    Decimal   @default(0) @db.Decimal(15, 2)
  gastosExtraArs  Decimal   @default(0) @db.Decimal(15, 2)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  lineasCompra    LineaCompra[]
  lotes           Lote[]

  @@index([empresaId, numeroDespacho])
  @@map("despachos_importacion")
}
`;
fs.appendFileSync('prisma/schema.prisma', text);
