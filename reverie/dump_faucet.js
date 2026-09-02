import { getExchange } from "./src/bot/dreamdex/exchange.js";

async function run() {
  const ex = await getExchange();
  console.log(ex.trader.faucet.toString());
  process.exit(0);
}
run();
