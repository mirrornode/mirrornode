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
var express_1 = require("express");
var zod_1 = require("zod");
var app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "2mb" }));
/**
 * Payload schema
 */
var OraclePayloadSchema = zod_1.z.object({
    instruction: zod_1.z.string().min(1, "instruction is required"),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    requestId: zod_1.z.string().optional()
});
/**
 * Health check
 */
app.get("/health", function (_req, res) {
    res.status(200).json({
        status: "ok",
        service: "oracle",
        time: new Date().toISOString()
    });
});
/**
 * Main oracle endpoint
 */
app.post("/oracle", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result, err_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                payload = OraclePayloadSchema.parse(req.body);
                return [4 /*yield*/, handleOracleInstruction(payload)];
            case 1:
                result = _c.sent();
                res.json({
                    ok: true,
                    requestId: (_a = payload.requestId) !== null && _a !== void 0 ? _a : null,
                    result: result
                });
                return [3 /*break*/, 3];
            case 2:
                err_1 = _c.sent();
                console.error("Oracle error:", err_1);
                if ((err_1 === null || err_1 === void 0 ? void 0 : err_1.name) === "ZodError") {
                    return [2 /*return*/, res.status(400).json({
                            ok: false,
                            error: "Invalid payload",
                            details: err_1.errors
                        })];
                }
                res.status(500).json({
                    ok: false,
                    error: (_b = err_1 === null || err_1 === void 0 ? void 0 : err_1.message) !== null && _b !== void 0 ? _b : "Internal error"
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * Feedback / echo endpoint
 */
app.all("/feedback", function (req, res) {
    var _a;
    res.json({
        ok: true,
        meta: {
            method: req.method,
            timestamp: Date.now()
        },
        body: (_a = req.body) !== null && _a !== void 0 ? _a : null
    });
});
/**
 * Oracle logic
 */
function handleOracleInstruction(input) {
    return __awaiter(this, void 0, void 0, function () {
        var instruction, data;
        return __generator(this, function (_a) {
            instruction = input.instruction, data = input.data;
            switch (instruction) {
                case "PING":
                    return [2 /*return*/, { message: "PONG", ts: Date.now() }];
                case "THOTH_ROUTE":
                    if (!data || typeof data.path !== "string") {
                        throw new Error("Missing Thoth route path");
                    }
                    return [2 /*return*/, {
                            routed: true,
                            path: data.path,
                            depth: typeof data.depth === "number" ? data.depth : 1
                        }];
                default:
                    throw new Error("Unknown instruction: ".concat(instruction));
            }
            return [2 /*return*/];
        });
    });
}
/**
 * IMPORTANT:
 * Do NOT call app.listen on Vercel.
 * Export the app as the handler.
 */
exports.default = app;
