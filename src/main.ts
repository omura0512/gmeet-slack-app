/*
 * Create Google Meet URL by Slack Slash command.
 * Author: Shuho Omura
*/

class SlackApi {
  private token: string;
  private membersInfo;

  constructor(token: string) {
    this.token = token;
    this.membersInfo = null;
  }

  getApiMethod(apiUrl: string, payload) {
    let options = {
      "method": "GET",
      "payload": payload,
    }

    const response = UrlFetchApp.fetch(apiUrl, options)
    return JSON.parse(response)
  }

  postApiMethod(apiUrl: string, payload) {
    let options = {
      "method": "POST",
      "payload": payload,
    }

    const response = UrlFetchApp.fetch(apiUrl, options)
    return JSON.parse(response)
  }

  getSlackMembers() {
    const SLACK_USERS_LIST_API = 'https://slack.com/api/users.list';

    if(this.membersInfo == null) {
      const payload = {
        "token": this.token,
      }
      const response = this.getApiMethod(SLACK_USERS_LIST_API, payload);
      this.membersInfo = response.members;
    }

    return this.membersInfo;    
  }

  getEmailBySlackId(slackId: string): string{
    let email: string = '';
    let membersInfo = this.getSlackMembers();
    membersInfo.forEach(memberInfo => {
      if(memberInfo.name == slackId) {
        console.log('DEBUG: email = ' + memberInfo.profile.email);
        email = memberInfo.profile.email;
      }
    });

    return email;
  }
}

class GCalendarApi {
  
  createRadomId() {
    return Math.random().toString(36).slice(-8);
  }

  formatEmailJson(emails) {
    let jsonEmails= [];
    emails.forEach(email => {
      jsonEmails.push({email:email})
    });

    return jsonEmails;
  }

  createCalendar(name: string, attendeeEmails: string[], start, end) {
    const calendarId = "primary";
    const conferenceType = "hangoutsMeet";
    const randomId = this.createRadomId();

    // Create config for calender info
    let jsonUsers = this.formatEmailJson(attendeeEmails);
    let calendarConfig = {
        summary: name,
        start: {
          dateTime: new Date(start).toISOString()
        },
        end: {
          dateTime: new Date(end).toISOString()
        },
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: {
              type: conferenceType
            },
            requestId: randomId
          }
        },
        attendees: jsonUsers,
    };
    console.log('DEBUG: calendarConfig = ' + JSON.stringify(calendarConfig));

    // Create Calendar
    return Calendar.Events.insert(calendarConfig, calendarId, { conferenceDataVersion: 1 });
}

function array2string(arr: string[]): string {
  return '[' + arr.join(', ') + ']';
}

function doPost(e) {
  // Get Environment Values
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_TOKEN");
  const meetingTime = parseInt(PropertiesService.getScriptProperties().getProperty("MEETING_TIME"));

  // Call API Classes
  let slackApi = new SlackApi(token);
  let gcalApi = new GCalendarApi();

  // Extract slack ids from args
  const args = e.parameter.text.split(' ');
  let slackIds: string[] = [];
  args.forEach(arg => {
    console.log(arg.replace('@', ''));
    slackIds.push(arg.replace('@', ''));
  });
  console.log('DEBUG: slackIds = ' + array2string(slackIds));

  // Get Emails by Slack IDs
  let attendeeEmails: string[] = [];
  const regEmail = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
  slackIds.forEach((id) => {
    let email = slackApi.getEmailBySlackId(id);
    // remove if not fit email format
    if(regEmail.test(email)) {
      attendeeEmails.push(slackApi.getEmailBySlackId(id));
    }
  });
  console.log('DEBUG: attendeeEmails = ' + array2string(attendeeEmails));

  // Get time 
  const nowTime = new Date();
  let start = nowTime.getFullYear() + '/' + String(parseInt(nowTime.getMonth())+1) + '/' + nowTime.getDate() + ' ' + nowTime.getHours() +':'+ nowTime.getMinutes() + ':' + nowTime.getSeconds();
  nowTime.setMinutes(nowTime.getMinutes() + meetingTime);
  let end = nowTime.getFullYear() + '/' + String(parseInt(nowTime.getMonth())+1) + '/' + nowTime.getDate() + ' ' + nowTime.getHours() +':'+ nowTime.getMinutes() + ':' + nowTime.getSeconds();

  // Create Calendar if attendee Email is existed
  if (attendeeEmails.length){
    const calendarObj = gcalApi.createCalendar("temporary meeting", attendeeEmails, start, end);
    const request2slack = {
      response_type : "in_channel", // Visible all users in channel
      text: 'Temporary meeting is created: ' + calendarObj.hangoutLink
    };
  } else {
    const request2slack = { text: "ERROR: cannot find users."};
  }
  return ContentService.createTextOutput(JSON.stringify(request2slack)).setMimeType(ContentService.MimeType.JSON);
}