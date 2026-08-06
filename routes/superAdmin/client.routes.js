import { Router } from "express";
import * as clientController from "../../controllers/superAdmin/client.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createClientValidator, updateClientValidator, clientIdValidator } from "../../validators/client.validator.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/", clientController.listClients);
router.post("/", createClientValidator, validateRequest, clientController.createClient);
router.put("/:id", updateClientValidator, validateRequest, clientController.updateClient);
router.delete("/:id", clientIdValidator, validateRequest, clientController.deleteClient);

export default router;
