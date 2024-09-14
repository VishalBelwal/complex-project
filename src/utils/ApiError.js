class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        //overwriting above fields
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false; //success code nahi jayega kyoki api errors ko ham handle kar rahe hai api response ko nhi
        this.errors = this.errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
