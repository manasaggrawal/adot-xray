import { hostname } from "os";
import { Service } from "typedi";
import { createLogger, format, transports } from "winston";
import httpContext from "express-http-context";
import { Span, context, trace } from "@opentelemetry/api";

@Service()
export class Logger {
  private module: string;
  private hostName: string = hostname();
  public logger = createLogger({
    format: format.combine(
      format.json({ deterministic: false }),
      format.colorize()
    ),
    transports: [new transports.Console()],
  });

  public info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }
  public warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }
  public error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }
  public debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }
  public log(
    level: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const requestId = httpContext.get("requestId");
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
  private getAwsTraceId() {
    const span: Span = trace?.getSpan(context.active());
    const xrayTraceId = span?.spanContext().traceId;
    const traceIdP1 = xrayTraceId?.substring(0, 8);
    const traceIdP2 = xrayTraceId?.substring(8, xrayTraceId.length);
    let traceId;
    if (xrayTraceId) {
      traceId =
        span?.spanContext().traceFlags + "-" + traceIdP1 + "-" + traceIdP2;
    }
    return traceId;
  }
}

export const logger = new Logger();
export default {
  error: (message?: string, error?: unknown) => {
    if (typeof error === "object") {
      logger.log("error", `${message} - ${JSON.stringify(error)}`);
    } else logger.log("error", `${message} - ${error}`);
  },
  warning: (warning: string) => {
    logger.log("warn", `${warning}`);
  },
  info: (info: unknown) => {
    if (typeof info === "object") {
      logger.log("info", `${JSON.stringify(info)}`);
    } else logger.log("info", `${info}`);
  },
  debug: (debug: unknown) => {
    if (typeof debug === "object") {
      logger.log("debug", `${JSON.stringify(debug)}`);
    } else logger.log("debug", `${debug}`);
  },
};
