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

// Welcome / Goodbye Channels
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

    // ─── NEW ───────────────────────────────────────
    new SlashCommandBuilder()
        .setName('tos')
        .setDescription('Shows Terms of Service'),

    new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Shows server rules'),
    // ───────────────────────────────────────────────

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

    // ─── existing commands ───────────────────────────────────────
    if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({ content: "No permission", ephemeral: true });
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || "No reason";
        const member = interaction.guild.members.cache.get(user.id);
        await member.ban({ reason }).catch(() => { });
        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("🔨 User Banned")
            .addFields(
                { name: "User", value: `${user.tag}`, inline: true },
                { name: "By", value: `${interaction.user.tag}`, inline: true },
                { name: "Reason", value: reason }
            )
            .setTimestamp();
        interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'kick') { /* ... same as before ... */ }
    if (interaction.commandName === 'mute') { /* ... same as before ... */ }
    if (interaction.commandName === 'warn') { /* ... same as before ... */ }
    if (interaction.commandName === 'clear') { /* ... same as before ... */ }
    if (interaction.commandName === 'msg') { /* ... same as before ... */ }

    // ─── NEW COMMANDS ─────────────────────────────────────────────
if (interaction.commandName === 'tos') {
    const tosEmbed = new EmbedBuilder()
        .setColor(0xFF5555)                    // red for strict terms
        .setTitle("📜 TERMS & SERVICES")
        .setDescription(
            "By placing an order, you automatically agree to the following terms:\n\u200B"
        )
        .addFields(
            {
                name: "1. Full Payment Upfront",
                value: "100% payment required before processing.",
                inline: false
            },
            {
                name: "2. No Refunds",
                value: "All sales are final. No refunds, even if you cancel.",
                inline: false
            },
            {
                name: "3. Vouch Mandatory",
                value: "You **must** leave a vouch/rep after delivery.",
                inline: false
            },
            {
                name: "4. No Vouch = No Warranty",
                value: "No feedback = no replacement or support.",
                inline: false
            },

            {
                name: "5. Pre-orders Non-Refundable",
                value: "Pre-orders cannot be cancelled or refunded.",
                inline: false
            },
            {
                name: "6. Proof Required",
                value: "Negative claims without valid proof → instant permanent ban.",
                inline: false
            },
            {
                name: "7. Feedback Required",
                value: "Mandatory feedback after receiving order.",
                inline: false
            },
            {
                name: "8. Delivery Time",
                value: "• Payment confirmation: few minutes\n• Estimated delivery: 24–48 hours",
                inline: false
            },
            {
                name: "9. Zero Tolerance",
                value: "Abuse, spam, threats → mute / timeout / ban",
                inline: false
            },
            {
                name: "10. False Accusations",
                value: "Fake scam reports without proof → no refund, no delivery, permanent ban",
                inline: false
            }
        )
        .setFooter({ 
            text: "We reserve the right to refuse service • Last updated: March 2025" 
        })
        .setTimestamp();

    await interaction.reply({ embeds: [tosEmbed] });
}

    if (interaction.commandName === 'rules') {
        const rulesEmbed = new EmbedBuilder()
            .setColor(0xED4245)           // red-ish for rules
            .setTitle("📜 Server Rules")
            .setDescription(
                "1. **Respect everyone** — no harassment, hate speech, slurs\n" +
                "2. **No spam / flood** — including emojis, mentions, copypasta\n" +
                "3. **No NSFW content** outside of the designated channel (if any)\n" +
                "4. **No advertising** without staff permission\n" +
                "5. **No sharing of Nitro/Boost scams, token grabbers, cheats**\n" +
                "6. **No selfbotting, mass DM, raiding**\n" +
                "7. **Use English** in public channels (or appropriate language channels)\n" +
                "8. **Follow Discord ToS & Community Guidelines**\n" +
                "9. **No evading punishments** (alt accounts, etc.)\n" +
                "10. **Staff word is final** — argue in DMs, not in public"
            )
            .addFields(
                { name: "⚠️ Breaking rules", value: "→ Warning → Mute → Kick → Ban", inline: false }
            )
            .setFooter({ text: "We want everyone to enjoy their stay • Have fun!" })
            .setTimestamp();

        await interaction.reply({ embeds: [rulesEmbed] });
    }
});

// Welcome Message
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎉 Welcome")
        .setDescription(`Welcome **${member.user.tag}** to **${member.guild.name}**`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    channel.send({ embeds: [embed] });
});

// Goodbye Message
client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("👋 Goodbye")
        .setDescription(`**${member.user.tag}** left the server`)
        .setTimestamp();
    channel.send({ embeds: [embed] });
});

client.login(TOKEN);
