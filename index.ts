import { APIGatewayProxyEvent, Context } from "aws-lambda";

export const run = async (event: APIGatewayProxyEvent, context: Context) => {
  const time = new Date();
  console.log(
    `typescript cron function "${context.functionName}" ran at ${time}`
  );
};
