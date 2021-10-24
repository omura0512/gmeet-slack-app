import { greeter } from "./module";
import { flat } from "ts-polyfill/lib/es2019-array";

declare var global: any;

global.testGreeter = () => {
  const user = "Grant";
  Logger.log(greeter(user));
};

global.testArrayFlat = () => {
  const a = [[1, 2], 3, 4];
  Logger.log(a.flat());
};
