//* ====== Imports ====== *//
import { Interaction, MessageFlags } from "discord.js";
import { commands } from "../handlers/commandHandler";
import { handleIssueModal } from "../handlers/issueModalHandler";
import { ENV } from "../../config/env";
import logger from "../../utils/logger";
import { getIssueModal } from "../../utils/modal";
import { CUSTOM_IDS, PUBLIC_COMMANDS } from "../../utils/constants";

//* ====== Interaction Event Handler ====== *//
export const handleInteraction = async (interaction: Interaction) => {
  if (!interaction.inGuild()) {
    if (interaction.isRepliable()) {
      return interaction.reply({
        content: "🚫 **Error:** This bot cannot be used in direct messages.",
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }

  if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
    const isPublicCmd = (PUBLIC_COMMANDS as readonly string[]).includes(interaction.commandName);

    if (!isPublicCmd && !ENV.DEVELOPER_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "🚫 **Access Denied:** You do not have permission to use this bot's management commands.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error("Failed to execute command", error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } else if (
    interaction.isStringSelectMenu() &&
    interaction.customId === CUSTOM_IDS.ISSUE_SELECT_MENU
  ) {
    const selectedValue = interaction.values[0];
    const modal = getIssueModal({ type: selectedValue });
    await interaction.showModal(modal);
  } else if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith(CUSTOM_IDS.MODAL_PREFIX)
  ) {
    await handleIssueModal(interaction);
  }
};
