// index.js - Single File Discord Bot (2026 - discord.js v14)
// Features: Moderation (mute, kick, ban, warn, clear, timeout), Welcome/Goodbye, Reaction Roles, Antispam/Antilink, Simple Giveaway, Ticket/Apply Modal, Server Info, Logging

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
});

const PREFIX = '!';

// Config from .env
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL || null;
const GOODBYE_CHANNEL_ID = process.env.GOODBYE_CHANNEL || null;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL || null;

// In-memory stores (single file limitation)
let reactionRoles = {}; // {msgId: {emoji: roleId}}
let warnings = {}; // {userId: count}
let giveaways = {}; // {msgId: {prize, winners, endTime, entrants: []}}
const spamTrack = new Map(); // userId → {count, last, msg}

// Log function
async function log(guild, text) {
  console.log(text);
  if (LOG_CHANNEL_ID) {
    const ch = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (ch) ch.send(text).catch(() => {});
  }
}

client.once('ready', () => {
  console.log(`Ready: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  // Antilink
  if (/https?:\/\/[^\s]+/gi.test(message.content) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    message.delete().catch(() => {});
    message.channel.send(`${message.author}, no links allowed!`).then(m => setTimeout(() => m.delete(), 5000));
    log(message.guild, `Antilink: ${message.author.tag} in #${message.channel.name}`);
    return;
  }

  // Antispam
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    const now = Date.now();
    let data = spamTrack.get(message.author.id) || {count: 0, last: 0, msg: ''};
    if (now - data.last < 2000 || data.msg === message.content) {
      data.count++;
      if (data.count >= 3) {
        message.delete();
        message.channel.send(`${message.author}, stop spamming!`).then(m => setTimeout(() => m.delete(), 3000));
        log(message.guild, `Antispam: ${message.author.tag} in #${message.channel.name}`);
      }
    } else {
      data.count = 1;
    }
    data.last = now;
    data.msg = message.content;
    spamTrack.set(message.author.id, data);
    setTimeout(() => spamTrack.delete(message.author.id), 15000);
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // Ban
  if (cmd === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('No perms!');
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) return message.reply('Mention user!');
    await target.ban({ reason: args.slice(1).join(' ') || 'No reason' }).catch(() => {});
    message.reply(`${target.user.tag} banned.`);
    log(message.guild, `Ban: ${target.user.tag} by ${message.author.tag}`);
  }

  // Kick
  if (cmd === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('No perms!');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mention user!');
    await target.kick(args.slice(1).join(' ') || 'No reason').catch(() => {});
    message.reply(`${target.user.tag} kicked.`);
    log(message.guild, `Kick: ${target.user.tag} by ${message.author.tag}`);
  }

  // Timeout / Mute
  if (cmd === 'mute' || cmd === 'timeout') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('No perms!');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mention user!');
    const mins = parseInt(args[1]) || 10;
    await target.timeout(mins * 60 * 1000, args.slice(2).join(' ') || 'Muted').catch(() => {});
    message.reply(`${target.user.tag} timed out for ${mins} min.`);
    log(message.guild, `Timeout: ${target.user.tag} (${mins} min) by ${message.author.tag}`);
  }

  // Warn
  if (cmd === 'warn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('No perms!');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mention user!');
    warnings[target.id] = (warnings[target.id] || 0) + 1;
    message.reply(`${target.user.tag} warned (${warnings[target.id]} warns).`);
    log(message.guild, `Warn: ${target.user.tag} (${warnings[target.id]}) by ${message.author.tag}`);
  }

  // Clear
  if (cmd === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('No perms!');
    const amt = parseInt(args[0]) || 20;
    if (amt < 1 || amt > 100) return message.reply('1-100 only.');
    await message.channel.bulkDelete(amt, true).catch(() => {});
    message.channel.send(`Cleared ${amt} msgs.`).then(m => setTimeout(() => m.delete(), 3000));
    log(message.guild, `Clear: ${amt} msgs in #${message.channel.name} by ${message.author.tag}`);
  }

  // Server Info
  if (cmd === 'serverinfo' || cmd === 'si') {
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle(message.guild.name)
      .setThumbnail(message.guild.iconURL())
      .addFields(
        { name: 'Owner', value: `<@${message.guild.ownerId}>`, inline: true },
        { name: 'Members', value: message.guild.memberCount.toString(), inline: true },
        { name: 'Created', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`, inline: true }
      );
    message.channel.send({ embeds: [embed] });
  }

  // Reaction Role Setup: !rr emoji @role (reply to msg)
  if (cmd === 'rr') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('No perms!');
    const emoji = args[0];
    const role = message.mentions.roles.first();
    if (!emoji || !role) return message.reply('!rr emoji @role (reply to msg)');
    const msg = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
    if (!msg) return message.reply('Reply to message!');
    await msg.react(emoji).catch(() => {});
    reactionRoles[msg.id] = reactionRoles[msg.id] || {};
    reactionRoles[msg.id][emoji] = role.id;
    message.reply('Reaction role set!');
  }

  // Giveaway: !giveaway mins winners prize
  if (cmd === 'giveaway') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('No perms!');
    const mins = parseInt(args[0]);
    const winners = parseInt(args[1]) || 1;
    const prize = args.slice(2).join(' ');
    if (!mins || !prize) return message.reply('!giveaway mins winners prize');
    const end = Date.now() + mins * 60000;
    const embed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY')
      .setDescription(`Prize: ${prize}\nWinners: ${winners}\nEnds: <t:${Math.floor(end/1000)}:R>\nReact 🎉 to enter!`)
      .setColor('Gold');
    const gMsg = await message.channel.send({ embeds: [embed] });
    await gMsg.react('🎉').catch(() => {});
    giveaways[gMsg.id] = { prize, winners, endTime: end, entrants: [] };
    setTimeout(async () => {
      const g = giveaways[gMsg.id];
      if (!g) return;
      const react = gMsg.reactions.cache.get('🎉');
      if (!react || react.count <= 1) return gMsg.reply('No entrants 😢');
      const users = await react.users.fetch().catch(() => {});
      const ents = users.filter(u => !u.bot).random(g.winners);
      gMsg.reply(`Winners: ${ents.map(u => u.toString()).join(', ')} | Prize: ${g.prize}`);
      delete giveaways[gMsg.id];
    }, mins * 60000);
  }

  // Apply/Ticket Panel: !applypanel
  if (cmd === 'applypanel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply('No perms!');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('apply').setLabel('Apply / Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('📝')
    );
    const embed = new EmbedBuilder().setTitle('Applications / Support').setDescription('Click to apply or open ticket.').setColor('Green');
    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// Reaction Roles Handlers
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  const rr = reactionRoles[reaction.message.id];
  if (!rr) return;
  const roleId = rr[reaction.emoji.name] || rr[reaction.emoji.id];
  if (roleId) reaction.message.guild.members.cache.get(user.id)?.roles.add(roleId).catch(() => {});
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  const rr = reactionRoles[reaction.message.id];
  if (!rr) return;
  const roleId = rr[reaction.emoji.name] || rr[reaction.emoji.id];
  if (roleId) reaction.message.guild.members.cache.get(user.id)?.roles.remove(roleId).catch(() => {});
});

// Welcome
client.on('guildMemberAdd', member => {
  if (WELCOME_CHANNEL_ID) {
    const ch = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (ch) ch.send(`Welcome ${member.user.tag} to ${member.guild.name}! 🎉`).catch(() => {});
  }
});

// Goodbye (separate channel)
client.on('guildMemberRemove', member => {
  if (GOODBYE_CHANNEL_ID) {
    const ch = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (ch) ch.send(`${member.user.tag} left the server 😢`).catch(() => {});
  }
});

// Ticket / Apply Interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'apply') {
    const modal = new ModalBuilder().setCustomId('apply_form').setTitle('Application Form');
    const input = new TextInputBuilder().setCustomId('why').setLabel('Why join/apply?').setStyle(TextInputStyle.Paragraph).setRequired(true);
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'apply_form') {
    const why = interaction.fields.getTextInputValue('why');
    await interaction.reply({ content: `Submitted! Reason: ${why}\nWait for staff.`, ephemeral: true });
    const channel = await interaction.guild.channels.create({
      name: `apply-${interaction.user.username}`,
      type: 0, // text channel
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
        // Add staff role: { id: 'STAFF_ROLE_ID', allow: ['ViewChannel', 'SendMessages'] }
      ],
    }).catch(() => {});
    if (channel) channel.send(`New application from ${interaction.user}\nReason: ${why}`);
    log(interaction.guild, `New ticket/apply: ${interaction.user.tag}`);
  }
});

client.login(process.env.TOKEN);
