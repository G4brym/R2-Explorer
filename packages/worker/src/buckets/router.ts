import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { config } from "../settings";
import { CreateFolder } from "./api/createFolder";
import { DeleteObject } from "./api/deleteObject";
import { GetObject } from "./api/getObject";
import { HeadObject } from "./api/headObject";
import { ListBuckets } from "./api/listBuckets";
import { ListObjects } from "./api/listObjects";
import { MoveObject } from "./api/moveObject";
import { CompleteUpload } from "./api/multipart/completeUpload";
import { CreateUpload } from "./api/multipart/createUpload";
import { PartUpload } from "./api/multipart/partUpload";
import { PutMetadata } from "./api/putMetadata";
import { PutObject } from "./api/putObject";

export const bucketsRouter = OpenAPIRouter({
	base: "/api/buckets",
	raiseUnknownParameters: config.raiseUnknownParameters,
	generateOperationIds: config.generateOperationIds,
});

bucketsRouter.get("", ListBuckets);
bucketsRouter.get("/:bucket", ListObjects);
bucketsRouter.post("/:bucket/move", MoveObject);
bucketsRouter.post("/:bucket/folder", CreateFolder);
bucketsRouter.post("/:bucket/upload", PutObject);
bucketsRouter.post("/:bucket/multipart/create", CreateUpload);
bucketsRouter.post("/:bucket/multipart/upload", PartUpload);
bucketsRouter.post("/:bucket/multipart/complete", CompleteUpload);
bucketsRouter.post("/:bucket/delete", DeleteObject);
bucketsRouter.head("/:bucket/:key", HeadObject);
bucketsRouter.get("/:bucket/:key/head", HeadObject); // There are some issues with calling the head method
bucketsRouter.get("/:bucket/:key", GetObject);
bucketsRouter.post("/:bucket/:key", PutMetadata);
