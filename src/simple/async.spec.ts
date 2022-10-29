/* eslint-disable unicorn/no-useless-undefined */

import { array } from "../composite";
import { ValidationResult } from "../validation";
import { async } from "./async";

const schema = array(
  async(() => Promise.resolve<ValidationResult<string>>(undefined))
);

it("validates", async () => {
  expect(await schema.validateAsync([""])).toBeUndefined();
});
