// index.js - Slash Command Discord Bot (discord.js v14)
require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Welcome / Goodbye Channels from .env
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL;
const GOODBYE_CHANNEL_ID = process.env.GOODBYE_CHANNEL;

let warnings = {};

const commands = [
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason')),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason')),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
        .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason')),
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages')
        .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('Send embed message to channel')
        .addStringOption(o => o.setName('channel_id').setDescription('Channel ID').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),
    new SlashCommandBuilder()
        .setName('tos')
        .setDescription('Shows Terms of Service'),
    new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Shows server rules'),
    new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give role to X members')
        .addIntegerOption(o => o.setName('count').setDescription('Number of members').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true)),
    new SlashCommandBuilder()
        .setName('legit')
        .setDescription('Send Legit Check Embed'),
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a simple giveaway')
        .addStringOption(o => o.setName('prize').setDescription('Prize to give').setRequired(true))
        .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(10))
        .addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(1440))
].map(cmd => cmd.toJSON());

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("Slash commands registered ✅");
    } catch (err) {
        console.log(err);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "legit") {
        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("Tec Trader - Embed")
            .setDescription(
                "**Are we Legit?**\n\n" +
                "✅ = Yes\n" +
                "❌ = Without Proof = Ban"
            )
            .setFooter({
                text: "Developed by @BAASHAA • 3/10/2026 "
            })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({
            content: "✅ Legit embed has been sent!",
            ephemeral: true
        });
    }
    // Other commands (ban, giverole, tos, rules etc.) remain unchanged
    // Paste your existing code for them here if needed
});

// ─── WELCOME MESSAGE (Dark Store Style) ─────────────────────────────
client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x8B00FF) // Neon purple
        .setTitle("Tec Trader")
        .setDescription(
            `Hey <@${member.id}>, welcome to **Tec Trader**!\n\n` +
            `YOU WILL FIND CONTENT RELATED TO ALL\n` +
            `GAMES AND SOFTWARES.`
        )
        .setThumbnail(client.user.displayAvatarURL({ forceStatic: true }))
        .setImage("https://cdn.discordapp.com/attachments/1337788828051701873/1480098172075376743/standard_1.gif?ex=69b06a97&is=69af1917&hm=3893d590b6f33d4d6baf945e5674c7b47e4803eefed8b70db4cf51a95f3b7907&") // Replace if needed
        .setAuthor({
            name: "Tec Trader",
            iconURL: client.user.displayAvatarURL({ forceStatic: true })
        })
        .setFooter({
            text: "Tec Trader • Stay in the Shadows"
        })
        .setTimestamp();

    await channel.send({
        content: `<@${member.id}>`,
        embeds: [welcomeEmbed]
    });
});

// ─── GOODBYE MESSAGE (Dark Vibe) ─────────────────────────────
client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (!channel) return;

    const goodbyeEmbed = new EmbedBuilder()
        .setColor(0x4B0082) // Dark purple
        .setTitle("Tec Trader")
        .setDescription(
            `**${member.user.tag}** has left the shadows...\n\n` +
            `The darkness will miss you.\n` +
            `Come back anytime...`
        )
        .setThumbnail(member.user.displayAvatarURL({ forceStatic: true }))
        .setImage("https://cdn.discordapp.com/attachments/1337788828051701873/1480098172075376743/standard_1.gif?ex=69b06a97&is=69af1917&hm=3893d590b6f33d4d6baf945e5674c7b47e4803eefed8b70db4cf51a95f3b7907&") // Replace if needed
        .setAuthor({
            name: "Tec Trader",
            iconURL: client.user.displayAvatarURL({ forceStatic: true })
        })
        .setFooter({
            text: "Tec Trader • The Void Awaits"
        })
        .setTimestamp();

    await channel.send({ embeds: [goodbyeEmbed] });
});

client.login(TOKEN);
