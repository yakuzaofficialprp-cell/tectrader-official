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
        .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 30m, 1h, 2d)').setRequired(true))
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

    if (interaction.commandName === "giveaway") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "You need Manage Messages permission!", ephemeral: true });
        }

        const prize = interaction.options.getString('prize');
        const winnersCount = interaction.options.getInteger('winners');
        const durationInput = interaction.options.getString('duration').toLowerCase().trim();

        // Parse duration (30m, 1h, 2d, etc.)
        let durationMs = 0;
        const match = durationInput.match(/^(\d+)([mhd])$/);
        if (!match) {
            return interaction.reply({ content: "Invalid duration! Use format like: 30m, 1h, 2d", ephemeral: true });
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        if (unit === 'm') durationMs = value * 60 * 1000;               // minutes
        else if (unit === 'h') durationMs = value * 60 * 60 * 1000;     // hours
        else if (unit === 'd') durationMs = value * 24 * 60 * 60 * 1000; // days

        if (durationMs < 60000 || durationMs > 7 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ content: "Duration must be between 1 minute and 7 days!", ephemeral: true });
        }

        const endTime = Date.now() + durationMs;
        const host = interaction.user;

        const giveawayEmbed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("🎉 GIVEAWAY STARTED! 🎉")
            .setDescription(
                `**Prize:** ${prize}\n` +
                `**Winners:** ${winnersCount}\n\n` +
                "React with 🎉 to enter!\n" +
                `Ends: <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)\n\n` +
                `Hosted by: ${host}`
            )
            .addFields(
                { name: "Entries", value: "0", inline: true }
            )
            .setFooter({ text: `Giveaway ID: ${interaction.id} • TEC TRADERS` })
            .setTimestamp();

        const msg = await interaction.channel.send({
            embeds: [giveawayEmbed],
            content: "@everyone Giveaway started! Join now 🎉"
        });
        await msg.react('🎉');

        await interaction.reply({
            content: `Giveaway started! Ends <t:${Math.floor(endTime / 1000)}:R>`,
            ephemeral: true
        });

        // Live entries update every 5 seconds (safe)
        const updateInterval = setInterval(async () => {
            try {
                const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
                const reaction = fetchedMsg.reactions.cache.get('🎉');
                if (!reaction) return;

                const count = reaction.count - 1;
                const updatedEmbed = EmbedBuilder.from(fetchedMsg.embeds[0])
                    .spliceFields(0, 1, { name: "Entries", value: count.toString(), inline: true });

                await fetchedMsg.edit({ embeds: [updatedEmbed] });
            } catch (err) {
                clearInterval(updateInterval);
            }
        }, 5000);

        // End giveaway
        setTimeout(async () => {
            clearInterval(updateInterval);
            try {
                const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
                const reaction = fetchedMsg.reactions.cache.get('🎉');
                if (!reaction) return;

                const users = await reaction.users.fetch();
                const entrants = users.filter(u => !u.bot).map(u => u.id);

                if (entrants.length === 0) {
                    const endEmbed = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("Giveaway Ended")
                        .setDescription("No one entered 😢")
                        .setTimestamp();
                    return fetchedMsg.edit({ embeds: [endEmbed], content: null });
                }

                const shuffled = entrants.sort(() => 0.5 - Math.random());
                const winners = shuffled.slice(0, winnersCount);
                const winnersMention = winners.map(id => `<@${id}>`).join(", ");

                const endEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setTitle("🎉 Giveaway Ended!")
                    .setDescription(
                        `**Prize:** ${prize}\n` +
                        `**Winners:** ${winnersMention}\n\n` +
                        "Congratulations! Contact the host to claim your prize."
                    )
                    .setFooter({ text: `Total entries: ${entrants.length}` })
                    .setTimestamp();

                await fetchedMsg.edit({ embeds: [endEmbed] });
                await fetchedMsg.reply(`Congratulations ${winnersMention}! You won **${prize}**!`);
            } catch (err) {
                console.log(err);
                await interaction.channel.send("Giveaway ended but there was an error picking winners.");
            }
        }, durationMs);
    }

    // Other commands (ban, giverole, tos, rules etc.) remain unchanged
});

// ─── WELCOME MESSAGE ─────────────────────────────
// ─── WELCOME MESSAGE (Dark Store Style) ─────────────────────────────
client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor("#8B0000") // red for fresh welcome vibe (ya purple chahiye to 0x8B00FF kar dena)
        .setTitle("Welcome to Tec Trader")
        .setDescription(
            `Welcome <@${member.id}> to **Tec Trader**!\n\n` +
            `• Read the rules & TOS: <#1337263610321305650>\n` +
            `• Need support? Create a ticket: <#1337266092812406844>\n` +
            `• Leave your vouch / feedback here: <#1403799364706767019>`
        )
        .addFields(
            { name: "Total Members", value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ forceStatic: true }))
        .setFooter({ text: "Tec Trader • Enjoy your stay!" })
        .setTimestamp();

    await channel.send({
        content: `<@${member.id}>`,
        embeds: [welcomeEmbed]
    });
});

// ─── GOODBYE MESSAGE ─────────────────────────────
client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (!channel) return;

    const goodbyeEmbed = new EmbedBuilder()
        .setColor("#8B0000")
        .setTitle("Tec Trader")
        .setDescription(
            `**${member.user.tag}** has left the shadows...\n\n` +
            `The darkness will miss you.\n` +
            `Come back anytime...`
        )
        .setThumbnail(member.user.displayAvatarURL({ forceStatic: true }))
        .setImage("https://cdn.discordapp.com/attachments/1337788828051701873/1480098172075376743/standard_1.gif?ex=69b06a97&is=69af1917&hm=3893d590b6f33d4d6baf945e5674c7b47e4803eefed8b70db4cf51a95f3b7907&")
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
