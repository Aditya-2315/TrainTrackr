import express from "express";
import cors from "cors";
import helmet from "helmet"
import morgan from "morgan";
import path from 'path'
import dotenv from "dotenv";    
import session from "express-session";
import passport from "./config/passport.js"
import authRoutes from "./routes/auth.routes.js"
import trainerRoutes from "./routes/trainer.routes.js"
import headRoutes from "./routes/head.routes.js"
import clientRoutes from "./routes/client.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import errorHandler from "./middleware/error.middleware.js";

dotenv.config();
const app = express()
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get('/health',(req,res)=>{
    res.json({sucess:true,message:"TrainTrackr Api is running"})
})

app.use("/api/auth", authRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/head",headRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/bookings", bookingRoutes);


app.use(errorHandler)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));