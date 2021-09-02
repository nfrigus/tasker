module.exports = {
  logsDir: __dirname + '/../var/logs',
  secretsDir: __dirname + '/secrets',
  discord: {
    token: '<token>',
    guilds: {
      CnC: '583963004773597184',
      dev: '788838172951314492',
    },
    channels: {
      wfh: '585434534661718016',
      dev: '788838172951314495',
    },
  },
  harvest: {
    task: {
      project_id: 24442002,
      task_id: 14155137,
    },
    credentials: {
      'Authorization': 'Bearer <token>',
      'Harvest-Account-ID': '1266901',
    },
  },
  timeDoctor: {
    client_id: '2649_2qf0mzs2plmo4ocwsw4wcooc4swg0wggwc4gs4og0o0scko4w0',
    company_id: 387775,
    secret_key: '<token>',
    user_id: 602776,
  },
  tracking: {
    sheets: {
      2020: '1S_EvpIkN62UQbW-iKEKPwZSdQLeYYFwf5yHXyfHexF4',
      2021: '1iAPLuHsYYErwUdNTR5kWm9ALhw0QMpP4HnsAh9AA8U4',
    },
  },
}
