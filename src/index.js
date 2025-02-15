const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, DefaultWebSocketManagerOptions, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const COUNTING_CHANNEL_ID = '1340305342499651674';
const REPORTS_CHANNEL_ID = "1340350118225907833";
const MUTUAL_ROLE_ID = "1340309208079405078";
const ADMIN_USER_ID = "779752580049928203";

const commands = [
  {
      name: 'ping',
      description: 'Returns pong',
      action: async (interaction) => {
        await interaction.reply("Pong")
      }
  },
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find((command) => command.name === interaction.commandName);
  if (!command) return;

  command.action(interaction);
});

client.on('messageCreate', async message => {
  if (message.author.id === ADMIN_USER_ID && message.content.includes('!rules')) {
    const row = new ActionRowBuilder()
      .addComponents(new ButtonBuilder()
        .setCustomId('urlButton')
        .setLabel('Report message')
        .setStyle(ButtonStyle.Secondary));

    message.channel.send({
      content: `# Rules

1. **Be civil and respectful**
Treat everyone with respect. Absolutely no harassment, witch hunting, sexism, racism, or hate speech will be tolerated. Insulting someone jokingly is allowed, if the other doesn't mind. The use of racial slurs is strictly prohibited for everyone.

2. **No NSFW or gore**
No age-restricted or obscene content. This includes text, images, or links featuring nudity, sex, hard violence, or other graphically disturbing content.

3. **Use common sense**
Use common sense. You can get banned at any time for any reason. Alt accounts are allowed unless they are made in order to bypass bans or timeouts.
‍`,
      components: [row]
    });
  }

  if (message.author.id === ADMIN_USER_ID && message.content.includes('!mootrole')) {
    message.channel.send({
      content: `To get the <@&${MUTUAL_ROLE_ID}> role, send me a DM with your Discord username.
‍`,

      flags: [4096],
      components: [new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
          .setURL("https://x.com/messages/compose?recipient_id=1340268334785376258")
          .setLabel('Send DM')
          .setStyle(ButtonStyle.Link))]
    });
  }

  if (message.author.id === ADMIN_USER_ID && message.content.includes('!applymod')) {
    const row = new ActionRowBuilder()
      .addComponents(new ButtonBuilder()
        .setLabel('Start new mod application')
        .setURL("https://docs.google.com/forms/d/e/1FAIpQLSfUUQFe9FiS-lnM1VFKrIeB4-FUeSrEqMHAma9D2HfJ7YO0Yg/viewform")
        .setStyle(ButtonStyle.Link));

    message.channel.send({
      content: `# Mod application

You can apply to be a moderator by filling out the form below. Make sure to answer all questions truthfully and to the best of your ability. Your application will be reviewed and we'll get back to you as soon as possible.
‍`,
      components: [row]
    });
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'urlButton') {
    const modal = new ModalBuilder()
      .setCustomId('reportModal')
      .setTitle('Report a message');

    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Message URL:')
      .setMaxLength(200)
      .setMinLength(25)
      .setPlaceholder('https://discord.com/channels/...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(urlInput));

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'reportModal') {
    const url = interaction.fields.getTextInputValue('url');

    if (!url.startsWith("https://discord.com/channels/") || url.includes("@everyone") || url.includes("@here")) {
      return interaction.reply({ content: `We were unable to process your report due to the message URL being invalid.`, ephemeral: true });
    }

    (await client.channels.fetch(REPORTS_CHANNEL_ID)).send({ content: `<@${interaction.user.id}>: ${url}` })

    interaction.reply({ content: `thank you for your report!`, ephemeral: true });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channelId !== COUNTING_CHANNEL_ID) return;

  try {
      const messages = await message.channel.messages.fetch({ limit: 2 });
      const [currentMsg, previousMsg] = messages.values();

      const currentNumber = parseInt(currentMsg.content);

      if (isNaN(currentNumber)) {
          await message.channel.send({
              content: `${message.author}, please send only numbers!`
          }).then(msg => setTimeout(() => msg.delete(), 3000));
          await message.delete();
          return;
      }

      if (!previousMsg) {
          if (currentNumber !== 1) {
              await message.channel.send({
                  content: `${message.author}, please start with 1!`
              }).then(msg => setTimeout(() => msg.delete(), 3000));
              await message.delete();
          }
          return;
      }

      const previousNumber = parseInt(previousMsg.content);

      if (isNaN(previousNumber)) return;

      if (currentNumber !== previousNumber + 1) {
          await message.channel.send({
              content: `<@${message.author.id}> the next number should be ${previousNumber + 1}!`
          }).then(msg => setTimeout(() => msg.delete(), 3000));
          await message.delete();
          return;
      }

      if (currentMsg.author.id === previousMsg.author.id) {
          await message.channel.send({
              content: `<@${message.author.id}> please wait for someone else to count!`
          }).then(msg => setTimeout(() => msg.delete(), 3000));
          await message.delete();
          return;
      }

  } catch (error) {
      console.error('Error in counting bot:', error);
  }
});

DefaultWebSocketManagerOptions.identifyProperties.browser = 'Discord iOS';
client.login(process.env.DISCORD_TOKEN);