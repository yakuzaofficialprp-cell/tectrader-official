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
        .addStringOption(o => o.setName('prize').setDescription('Prize jo dena hai').setRequired(true))
        .addIntegerOption(o => o.setName('winners').setDescription('Kitne winners').setRequired(true).setMinValue(1).setMaxValue(10))
        .addIntegerOption(o => o.setName('duration').setDescription('Kitne minutes tak chalega').setRequired(true).setMinValue(1).setMaxValue(1440))
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

    // ─── LEGIT EMBED COMMAND (MINIMAL & CLEAN) ─────────────────────────────
    if (interaction.commandName === "legit") {
        const embed = new EmbedBuilder()
            .setColor("#8A2BE2") // TEC TRADERS purple
            .setAuthor({
                name: "TEC TRADERS",
                iconURL: "https://cdn.discordapp.com/attachments/1337788828051701873/1480098172075376743/standard_1.gif?ex=69b06a97&is=69af1917&hm=3893d590b6f33d4d6baf945e5674c7b47e4803eefed8b70db4cf51a95f3b7907&", // apna logo daal lena
            })
            .setTitle("🔍 LEGIT CHECK - Are We Legit?")
            .setDescription(
                "**TEC TRADERS Service Verification**\n\n" +
                "✅ **= Yes, 100% Legit**\n" +
                "❌ **= Without Solid Proof = Ban / Blacklist**\n\n" +
                "Proof ke saath hi claim karo (pic direct link + store name). Fake report = permanent ban."
            )
            .setThumbnail("https://cdn.discordapp.com/attachments/1337788828051701873/1475668721010741248/tec_trader-removebg-preview_1.png?ex=69b0c817&is=69af7697&hm=1519e14662ee4c0b5fbfc27be3942cf4f5b2d79c22d180261855dd913d2e7941&")
            .setImage("https://cdn.discordapp.com/attachments/1337788828051701873/1475668721010741248/tec_trader-removebg-preview_1.png?ex=69b01f57&is=69aecdd7&hm=f30307c268b24c2c5b79cfd9d2d874fd5f8b6e53e2acb1ccde1f45b1a72b9341&")
            .setFooter({
                text: "TEC TRADERS • Trusted Services • Developed by @meko1st"
            })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({
            content: "✅ TEC TRADERS Legit Check embed bhej diya gaya!",
            ephemeral: true
        });
    }

      // ─── IMPROVED GIVEAWAY COMMAND (1 second live update) ────────────────────────────────
    if (interaction.commandName === "giveaway") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "Manage Messages permission chahiye giveaway start karne ke liye!", ephemeral: true });
        }

        const prize = interaction.options.getString('prize');
        const winnersCount = interaction.options.getInteger('winners');
        const durationMinutes = interaction.options.getInteger('duration');
        const endTime = Date.now() + durationMinutes * 60 * 1000;
        const host = interaction.user;

        const giveawayEmbed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("🎉 GIVEAWAY STARTED! 🎉")
            .setDescription(
                `**Prize:** ${prize}\n` +
                `**Winners:** ${winnersCount}\n\n` +
                "React karo 🎉 enter karne ke liye!\n" +
                `Ends: <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)\n\n` +
                `Hosted by: ${host}`
            )
            .addFields(
                { name: "Entries", value: "0 abhi tak", inline: true }
            )
            .setFooter({ text: `Giveaway ID: ${interaction.id} • TEC TRADERS` })
            .setTimestamp();

        const msg = await interaction.channel.send({ 
            embeds: [giveawayEmbed],
            content: "@everyone Giveaway shuru! Jaldi participate karo 🎉"
        });
        await msg.react('🎉');

        await interaction.reply({
            content: `Giveaway shuru ho gaya! Ends <t:${Math.floor(endTime / 1000)}:R>\nHosted by ${host}`,
            ephemeral: true
        });

        // Live entries update - har 1 second (1000ms)
        const updateInterval = setInterval(async () => {
            try {
                const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
                const reaction = fetchedMsg.reactions.cache.get('🎉');
                if (!reaction) return;

                const count = reaction.count - 1; // bot ka react minus kar rahe hain
                const updatedEmbed = EmbedBuilder.from(fetchedMsg.embeds[0])
                    .spliceFields(0, 1, { name: "Entries", value: `${count} abhi tak`, inline: true });

                await fetchedMsg.edit({ embeds: [updatedEmbed] });
            } catch (err) {
                // agar error aaye (rate limit ya message delete) to interval stop
                clearInterval(updateInterval);
            }
        }, 1000);  // ← yahan 1000ms = 1 second

        // Giveaway end logic
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
                        .setTitle("Giveaway Khatam")
                        .setDescription("Koi participate nahi kiya 😢")
                        .setTimestamp();
                    return fetchedMsg.edit({ embeds: [endEmbed], content: null });
                }

                const shuffled = entrants.sort(() => 0.5 - Math.random());
                const winners = shuffled.slice(0, winnersCount);
                const winnersMention = winners.map(id => `<@${id}>`).join(", ");

                const endEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setTitle("🎉 Giveaway Khatam - Winners!")
                    .setDescription(
                        `**Prize:** ${prize}\n\n` +
                        `Winners: ${winnersMention}\n\n` +
                        `Host <@${host.id}> se prize claim karo!`
                    )
                    .setFooter({ text: `TEC TRADERS • Hosted by ${host.tag}` })
                    .setTimestamp();

                await fetchedMsg.edit({ 
                    embeds: [endEmbed], 
                    content: winnersMention  // sirf winners tag
                });

            } catch (err) {
                console.log(err);
                await interaction.channel.send("Giveaway end hua lekin error aaya.");
            }
        }, durationMinutes * 60 * 1000);
    }

    // ─── existing commands (same as before) ───────────────────────────────────────
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

    if (interaction.commandName === 'giverole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
            return interaction.reply({ content: "No permission", ephemeral: true });
        const count = interaction.options.getInteger('count');
        const role = interaction.options.getRole('role');
        await interaction.reply({ content: `Giving role to ${count} members...`, ephemeral: true });
        const members = await interaction.guild.members.fetch();
        let given = 0;
        for (const member of members.values()) {
            if (given >= count) break;
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    given++;
                } catch (e) {}
            }
        }
        await interaction.followUp({
            content: `Role ${role.name} given to ${given} members`,
            ephemeral: true
        });
    }

    if (interaction.commandName === 'tos') {
        const tosEmbed = new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle("📜 TERMS & SERVICES")
            .setDescription("By placing an order, you automatically agree to the following terms:\n\u200B")
            .addFields(
                { name: "1. Full Payment Upfront", value: "100% payment required before processing.", inline: false },
                { name: "2. No Refunds", value: "All sales are final. No refunds, even if you cancel.", inline: false },
                { name: "3. Vouch Mandatory", value: "You **must** leave a vouch/rep after delivery.", inline: false },
                { name: "4. No Vouch = No Warranty", value: "No feedback = no replacement or support.", inline: false },
                { name: "5. Pre-orders Non-Refundable", value: "Pre-orders cannot be cancelled or refunded.", inline: false },
                { name: "6. Proof Required", value: "Negative claims without valid proof → instant permanent ban.", inline: false },
                { name: "7. Feedback Required", value: "Mandatory feedback after receiving order.", inline: false },
                { name: "8. Delivery Time", value: "• Payment confirmation: few minutes\n• Estimated delivery: 24–48 hours", inline: false },
                { name: "9. Zero Tolerance", value: "Abuse, spam, threats → mute / timeout / ban", inline: false },
                { name: "10. False Accusations", value: "Fake scam reports without proof → no refund, no delivery, permanent ban", inline: false }
            )
            .setFooter({ text: "We reserve the right to refuse service • Last updated: March 2025" })
            .setTimestamp();
        await interaction.reply({ embeds: [tosEmbed] });
    }

    if (interaction.commandName === 'rules') {
        const rulesEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle("📜 Server Rules")
            .setDescription(
                "1. **Respect everyone**\n" +
                "2. **No spam**\n" +
                "3. **No NSFW**\n" +
                "4. **No advertising**\n" +
                "5. **Follow Discord ToS**"
            )
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
