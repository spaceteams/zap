import { object } from "./composite";
import { number, string } from "./simple";

const s = object({
  name: string(),
  age: number(),
  nested: object({ id: string() }),
});

test("parse", () => {
  performance.measure("Start parse");
  performance.mark("A");
  for (let i = 0; i < 1; i++) {
    s.parse({
      name: "hello",
      age: 12,
      nested: {
        id: "12",
      },
    });
  }
  performance.mark("B");
  console.log(performance.measure("parse A to B", "A", "B"));
});
