import { Router } from "express";
import { authenticateEditor, createAuthToken } from "../auth.js";
import { asyncHandler, sendError, sendSuccess } from "../http.js";

const router = Router();
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await authenticateEditor(
      String(req.body?.username || ""),
      String(req.body?.password || ""),
    );
    if (!user) {
      sendError(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid editor username or password",
      );
      return;
    }
    sendSuccess(res, { token: createAuthToken(user), user });
  }),
);
export { router as authRouter };
