// @ts-check
import { module } from "@prisma/composer";
import myAppService from "./service.mjs";

export default module("ghost-ai", ({ provision }) => {
  provision(myAppService, { id: "myapp" });
});
