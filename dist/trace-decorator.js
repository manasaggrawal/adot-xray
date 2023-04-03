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
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceDecorator = void 0;
const api_1 = require("@opentelemetry/api");
const logger_1 = require("./logger");
//active span decorator
function traceDecorator() {
    return (_target, _propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const tracer = api_1.trace.getTracer("global-tracer");
                return tracer.startActiveSpan(`${_target.constructor.name} #${_propertyKey}`, (span) => __awaiter(this, void 0, void 0, function* () {
                    logger_1.logger.info(`${_target.constructor.name} #${_propertyKey} SPAN STARTS!`);
                    try {
                        const result = yield originalMethod.apply(this, args);
                        span.setStatus({ code: api_1.SpanStatusCode.OK });
                        span.setAttributes(result);
                        return result;
                    }
                    catch (err) {
                        logger_1.logger.error(`ERROR IN - ${_target.constructor.name} #${_propertyKey}`, {
                            err,
                        });
                        span.setStatus({
                            code: api_1.SpanStatusCode.ERROR,
                            message: err.message,
                        });
                        throw err;
                    }
                    finally {
                        logger_1.logger.info(`${_target.constructor.name} #${_propertyKey} SPAN ENDS!`);
                        span.end();
                    }
                }));
            });
        };
        return descriptor;
    };
}
exports.traceDecorator = traceDecorator;
