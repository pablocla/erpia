"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
var server_1 = require("next/server");
var prisma_1 = require("@/lib/prisma");
var empresa_guard_1 = require("@/lib/auth/empresa-guard");
var ai_1 = require("@/lib/ai");
var event_bus_1 = require("@/lib/events/event-bus");
require("@/lib/producto/producto-event-handlers");
function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, searchParams, search, categoriaId, soloActivos, bajoStock, esPlato, esInsumo, where, productos, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, empresa_guard_1.getAuthContext)(request)];
                case 1:
                    ctx = _a.sent();
                    if (!ctx.ok)
                        return [2 /*return*/, ctx.response];
                    searchParams = new URL(request.url).searchParams;
                    search = searchParams.get("search") || "";
                    categoriaId = searchParams.get("categoriaId");
                    soloActivos = searchParams.get("soloActivos") !== "false";
                    bajoStock = searchParams.get("bajoStock") === "true";
                    esPlato = searchParams.get("esPlato");
                    esInsumo = searchParams.get("esInsumo");
                    where = { empresaId: ctx.auth.empresaId };
                    if (soloActivos)
                        where.activo = true;
                    if (categoriaId)
                        where.categoriaId = parseInt(categoriaId);
                    if (esPlato !== null)
                        where.esPlato = esPlato === "true";
                    if (esInsumo !== null)
                        where.esInsumo = esInsumo === "true";
                    if (search) {
                        where.OR = [
                            { nombre: { contains: search, mode: "insensitive" } },
                            { codigo: { contains: search, mode: "insensitive" } },
                            { descripcion: { contains: search, mode: "insensitive" } },
                        ];
                    }
                    return [4 /*yield*/, prisma_1.prisma.producto.findMany({
                            where: where,
                            include: { categoria: true },
                            orderBy: { nombre: "asc" },
                        })];
                case 2:
                    productos = _a.sent();
                    result = bajoStock ? productos.filter(function (p) { return p.stock <= p.stockMinimo; }) : productos;
                    return [2 /*return*/, server_1.NextResponse.json(result)];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error al obtener productos:", error_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, body, codigo, nombre, descripcion, precioVenta, precioCompra, porcentajeIva, stock, stockMinimo, unidad, categoriaId, esPlato, esInsumo, existente, producto, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, (0, empresa_guard_1.getAuthContext)(request)];
                case 1:
                    ctx = _a.sent();
                    if (!ctx.ok)
                        return [2 /*return*/, ctx.response];
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _a.sent();
                    codigo = body.codigo, nombre = body.nombre, descripcion = body.descripcion, precioVenta = body.precioVenta, precioCompra = body.precioCompra, porcentajeIva = body.porcentajeIva, stock = body.stock, stockMinimo = body.stockMinimo, unidad = body.unidad, categoriaId = body.categoriaId, esPlato = body.esPlato, esInsumo = body.esInsumo;
                    if (!codigo || !nombre || precioVenta === undefined) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Código, nombre y precio de venta son obligatorios" }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma_1.prisma.producto.findFirst({
                            where: (0, empresa_guard_1.whereEmpresa)(ctx.auth.empresaId, { codigo: codigo }),
                        })];
                case 3:
                    existente = _a.sent();
                    if (existente) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Ya existe un producto con ese código" }, { status: 409 })];
                    }
                    return [4 /*yield*/, prisma_1.prisma.producto.create({
                            data: {
                                codigo: codigo,
                                nombre: nombre,
                                descripcion: descripcion,
                                precioVenta: parseFloat(precioVenta),
                                precioCompra: parseFloat(precioCompra || 0),
                                porcentajeIva: parseFloat(porcentajeIva || 21),
                                stock: parseFloat(stock || 0),
                                stockMinimo: parseFloat(stockMinimo || 0),
                                unidad: unidad || "unidad",
                                categoriaId: categoriaId ? parseInt(categoriaId) : null,
                                esPlato: Boolean(esPlato),
                                esInsumo: Boolean(esInsumo),
                                empresaId: ctx.auth.empresaId,
                            },
                            include: { categoria: true },
                        })
                        // Registrar movimiento de stock inicial si > 0
                    ];
                case 4:
                    producto = _a.sent();
                    if (!(producto.stock > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma_1.prisma.movimientoStock.create({
                            data: {
                                productoId: producto.id,
                                tipo: "entrada",
                                cantidad: producto.stock,
                                motivo: "Stock inicial",
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, event_bus_1.eventBus.emit({
                        type: "PRODUCTO_CREADO",
                        payload: {
                            productoId: producto.id,
                            empresaId: ctx.auth.empresaId,
                            codigo: producto.codigo,
                            nombre: producto.nombre,
                            activo: producto.activo,
                            categoriaId: producto.categoriaId,
                            precioVenta: producto.precioVenta,
                            precioCompra: producto.precioCompra,
                            porcentajeIva: producto.porcentajeIva,
                            esPlato: producto.esPlato,
                            esInsumo: producto.esInsumo,
                            stock: producto.stock,
                            stockMinimo: producto.stockMinimo,
                        },
                        timestamp: new Date(),
                        userId: ctx.auth.userId,
                        empresaId: ctx.auth.empresaId,
                    })];
                case 7:
                    _a.sent();
                    (0, ai_1.invalidateContextCache)(ctx.auth.empresaId);
                    return [2 /*return*/, server_1.NextResponse.json(producto, { status: 201 })];
                case 8:
                    error_2 = _a.sent();
                    console.error("Error al crear producto:", error_2);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Error al crear producto" }, { status: 500 })];
                case 9: return [2 /*return*/];
            }
        });
    });
}
