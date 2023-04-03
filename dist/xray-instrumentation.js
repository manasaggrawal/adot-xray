"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adotInit = void 0;
const process_1 = __importDefault(require("process"));
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const propagator_aws_xray_1 = require("@opentelemetry/propagator-aws-xray");
const id_generator_aws_xray_1 = require("@opentelemetry/id-generator-aws-xray");
const opentelemetry = __importStar(require("@opentelemetry/sdk-node"));
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
function adotInit() {
    const traceExporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter();
    const spanProcessor = new sdk_trace_base_1.BatchSpanProcessor(traceExporter);
    const tracerConfig = {
        idGenerator: new id_generator_aws_xray_1.AWSXRayIdGenerator(),
    };
    const sdk = new opentelemetry.NodeSDK({
        textMapPropagator: new propagator_aws_xray_1.AWSXRayPropagator(),
        instrumentations: [
            (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                "@opentelemetry/instrumentation-http": {
                    ignoreIncomingRequestHook: (request) => {
                        return request.url.includes("/healthz");
                    },
                },
                "@opentelemetry/instrumentation-aws-sdk": {
                    suppressInternalInstrumentation: true,
                },
                "@opentelemetry/instrumentation-winston": {
                    logHook: (span, record) => {
                        record["resource.service.name"] = "oddschecker";
                    },
                },
            }),
        ],
        resource: resources_1.Resource.default().merge(new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: "oddschecker",
        })),
        spanProcessor,
        traceExporter,
    });
    sdk.configureTracerProvider(tracerConfig, spanProcessor);
    // this enables the API to record telemetry
    sdk.start();
    // gracefully shut down the SDK on process exit
    process_1.default.on("SIGTERM", () => {
        sdk.shutdown();
    });
}
exports.adotInit = adotInit;
