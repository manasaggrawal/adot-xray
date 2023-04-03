"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const os_1 = require("os");
const typedi_1 = require("typedi");
const winston_1 = require("winston");
const express_http_context_1 = __importDefault(require("express-http-context"));
const api_1 = require("@opentelemetry/api");
let Logger = class Logger {
    constructor() {
        this.hostName = (0, os_1.hostname)();
        this.logger = (0, winston_1.createLogger)({
            format: winston_1.format.combine(winston_1.format.json({ deterministic: false }), winston_1.format.colorize()),
            transports: [new winston_1.transports.Console()],
        });
    }
    info(message, data) {
        this.log("info", message, data);
    }
    warn(message, data) {
        this.log("warn", message, data);
    }
    error(message, data) {
        this.log("error", message, data);
    }
    debug(message, data) {
        this.log("debug", message, data);
    }
    log(level, message, data) {
        const requestId = express_http_context_1.default.get("requestId");
        const traceId = this.getAwsTraceId();
        const logEntry = {
            message,
            level,
            data,
            traceId,
            // label: this.module,
            hostname: this.hostName,
            requestId,
            timestamp: new Date(),
        };
        this.logger.log(logEntry);
    }
    //Method to convert opentelemetry trace Id to AWS Xray trace Id.
    getAwsTraceId() {
        const span = api_1.trace === null || api_1.trace === void 0 ? void 0 : api_1.trace.getSpan(api_1.context.active());
        const xrayTraceId = span === null || span === void 0 ? void 0 : span.spanContext().traceId;
        const traceIdP1 = xrayTraceId === null || xrayTraceId === void 0 ? void 0 : xrayTraceId.substring(0, 8);
        const traceIdP2 = xrayTraceId === null || xrayTraceId === void 0 ? void 0 : xrayTraceId.substring(8, xrayTraceId.length);
        let traceId;
        if (xrayTraceId) {
            traceId =
                (span === null || span === void 0 ? void 0 : span.spanContext().traceFlags) + "-" + traceIdP1 + "-" + traceIdP2;
        }
        return traceId;
    }
};
Logger = __decorate([
    (0, typedi_1.Service)()
], Logger);
exports.Logger = Logger;
exports.logger = new Logger();
exports.default = {
    error: (message, error) => {
        if (typeof error === "object") {
            exports.logger.log("error", `${message} - ${JSON.stringify(error)}`);
        }
        else
            exports.logger.log("error", `${message} - ${error}`);
    },
    warning: (warning) => {
        exports.logger.log("warn", `${warning}`);
    },
    info: (info) => {
        if (typeof info === "object") {
            exports.logger.log("info", `${JSON.stringify(info)}`);
        }
        else
            exports.logger.log("info", `${info}`);
    },
    debug: (debug) => {
        if (typeof debug === "object") {
            exports.logger.log("debug", `${JSON.stringify(debug)}`);
        }
        else
            exports.logger.log("debug", `${debug}`);
    },
};
