import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
const https = require('node:https');
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';
var privateKey = fs.readFileSync('/etc/letsencrypt/live/kasugasorata.monster/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/kasugasorata.monster/cert.pem', 'utf8');
var ca = fs.readFileSync('/etc/letsencrypt/live/kasugasorata.monster/chain.pem', 'utf8');

const app = express();
const port = process.env.PORT;

app.use(
    "/",
    createProxyMiddleware({
        target: "",
        changeOrigin: true,
        pathRewrite: {
            [`^/`]: "",
        },
        router: (req: Request) => {
            const proxyTarget = req.headers["proxy-target"];
            if (proxyTarget) {
                const proxyTarget = req.headers["proxy-target"] as string;
                if (
                    !(
                        proxyTarget.startsWith("https://") ||
                        proxyTarget.startsWith("http://")
                    )
                ) {
                    throw {
                        code: "ProxyTargetInvalid",
                        message: "Please provide proper hostname with https or http",
                        status: 400,
                    };
                }
                return proxyTarget;
            } else {
                throw {
                    code: "ProxyTargetNotFound",
                    message: "proxy-target header is not found",
                    status: 404,
                };
            }
        },
    })
);

app.use(
    (
        err: { code: string; message: string; status: number },
        _req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        if (err) {
            res.status(err.status).json({ code: err.code, message: err.message });
        }
    }
);

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
}

https.createServer(credentials, app).listen(port, () => {
    console.log("Proxy listening to port: " + port)
});

