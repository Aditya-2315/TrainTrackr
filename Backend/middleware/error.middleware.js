import ApiError from "../utils/ApiError.js";

const errorHandler = (err,req,res,next)=>{
    if (err instanceof ApiError){
        return res.status(err.statusCode).json({
            success:false,
            message:err.message,
        });
    }

    if(err.code === "P2025"){
        return res.status(404).json({
            success:false,
            message:"Record not found.",
        });
    }

    if(err.code === "P2002"){
        return res.status(409).json({
            success:false,
            message:"A record with this value already exists",
        });
    }

    console.error("Unexpected error: ", err);
      return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error.",
  });
};

export default errorHandler;