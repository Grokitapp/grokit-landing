import { defineBackend } from "@aws-amplify/backend";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { generateOutline } from "./functions/generate-outline/resource";
import { generateLesson } from "./functions/generate-lesson/resource";

defineBackend({
  auth,
  data,
  generateOutline,
  generateLesson,
});