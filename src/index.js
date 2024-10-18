// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");
const viem = require("viem");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function calculateMultiples(num) {
  let multiples = "";
  for (let i = 1; i <= 5; i++) {
    multiples += (num * i).toString();
    if (i < 5) {
      multiples += ", ";
    }
  }
  return multiples;
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const numberHex = data["payload"];
  const number = parseInt(viem.hexToString(numberHex));

  try {
    const multiples = calculateMultiples(number);

    console.log(`Adding notice with  value ${multiples}`);

    const hexresult = viem.stringToHex(multiples);

    await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: hexresult }),
    });
  } catch (error) {
    console.error("Error while adding notice: " + error);
  }

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
