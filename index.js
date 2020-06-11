import express from "express";
import gradesRouter from "./routes/grades.js";
import winston from 'winston'

const app = express();
const port = 3000;

const { combine, timestamp, label, printf } = winston.format
const myFormatLog = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})
const logger = winston.createLogger({
  level: 'silly',
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({filename: 'grades-api.log'})
  ],
  format: combine(
    label({ label: 'grades-api'}),
    timestamp(),
    myFormatLog
  )
})

app.use(express.json());
app.use('/grades', gradesRouter);

app.listen(port, async () => {
  try {
    logger.info("API started");
  } catch (error) {
    console.log("Error");
  }
});

export default logger