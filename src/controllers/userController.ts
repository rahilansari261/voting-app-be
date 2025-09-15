import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { CreateUserRequest, SafeUser } from "../types";
import ErrorResponse from "../utils/errorResponse";
import SuccessResponse from "../utils/successResponse";
import { StatusCodes } from "http-status-codes";

const userService = new UserService();

export class UserController {
  async createUser(req: Request, res: Response): Promise<any> {
    try {
      const userData: CreateUserRequest = req.body;

      if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(new ErrorResponse("Name, email, password, and confirm password are required", null, null));
      }

      if (userData.password !== userData.confirmPassword) {
        const eR = new ErrorResponse("Passwords do not match", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const user: SafeUser = await userService.createUser(userData);

      const sR = new SuccessResponse(
        "User created successfully",
        {
          user,
          token: userService.generateToken(user.id),
        },
        null
      );
      return res.status(StatusCodes.CREATED).json(sR);
    } catch (error) {
      console.error("Error creating user:", error);

      if (error instanceof Error) {
        if (error.message === "Email already exists") {
          const eR = new ErrorResponse("Email already exists", null, null);
          return res.status(StatusCodes.CONFLICT).json(eR);
        }
      }

      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getUserById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse("Bad Request", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const user: SafeUser = await userService.getUserById(id);

      const sR = new SuccessResponse("User fetched successfully", user, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error("Error fetching user:", error);

      if (error instanceof Error && error.message === "User not found") {
        const eR = new ErrorResponse("Not Found", null, null);
        return res.status(StatusCodes.NOT_FOUND).json(eR);
      }

      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const eR = new ErrorResponse("Email and password are required", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const user: SafeUser = await userService.validateCredentials(email, password);
      const token: string = userService.generateToken(user.id);

      const sR = new SuccessResponse(
        "Login successful",
        {
          user,
          token,
        },
        null
      );
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error("Error during login:", error);

      if (error instanceof Error && error.message === "Invalid credentials") {
        const eR = new ErrorResponse("Invalid email or password", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }
}
