#!/usr/bin/env node
import { spawn } from "node:child_process";

function parseDuration(value) {
  const match = /^(\d+)(ms|s|m)?$/.exec(value);
  if (!match) {
    throw new Error(`Unsupported duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "ms";
  if (unit === "m") return amount * 60_000;
  if (unit === "s") return amount * 1_000;
  return amount;
}

const [timeoutValue, killAfterValue, command, ...args] = process.argv.slice(2);
if (!timeoutValue || !killAfterValue || !command) {
  console.error(
    "usage: run-with-timeout.mjs timeout kill-after command [args...]",
  );
  process.exit(64);
}

const child = spawn(command, args, { stdio: "inherit" });
let finished = false;

const killTimer = setTimeout(() => {
  if (finished) return;
  console.error(`[sites] command exceeded ${timeoutValue}; terminating`);
  child.kill("SIGTERM");
  setTimeout(() => {
    if (!finished) child.kill("SIGKILL");
  }, parseDuration(killAfterValue)).unref();
}, parseDuration(timeoutValue));

child.on("exit", (code, signal) => {
  finished = true;
  clearTimeout(killTimer);
  if (signal) {
    console.error(`[sites] command exited after signal ${signal}`);
    process.exit(124);
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  finished = true;
  clearTimeout(killTimer);
  console.error(error.message);
  process.exit(127);
});
