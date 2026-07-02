//* ====== Imports ====== *//
import { Client } from "discord.js";
import { ENV } from "../../config/env";
import { commands } from "../handlers/commandHandler";
import logger from "../../utils/logger";

//* ====== Ready Event Handler ====== *//
export const handleReady = async (client: Client) => {
  logger.log("⏳ Registering commands...");
  const guildId = ENV.GUILD_ID;

  const commandsData = commands.map((c) => c.data);
  if (commandsData.length > 0) {
    try {
      if (guildId) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          await guild.commands.set(commandsData);
          await client.application?.commands.set([]); // Clear global commands to prevent duplicates
          logger.log("✅ Commands successfully registered for guild!");
        } else {
          await client.application?.commands.set(commandsData);
          logger.log("✅ Commands successfully registered globally (guild not found)!");
        }
      } else {
        await client.application?.commands.set(commandsData);
        logger.log("✅ Commands successfully registered globally!");
      }
    } catch (err) {
      logger.error("Failed to register commands", err);
    }
  }
};
