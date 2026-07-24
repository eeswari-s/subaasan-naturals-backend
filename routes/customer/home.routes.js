import { Router } from "express";
import * as homeController from "../../controllers/customer/home.controller.js";

const router = Router();

router.get("/", homeController.getHomeData);

export default router;
