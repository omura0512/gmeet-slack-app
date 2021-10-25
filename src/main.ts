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

  getEmailBySlackId(slackId: string){
    let membersInfo = this.getSlackMembers();
    membersInfo.forEach(memberInfo => {
      if(memberInfo.name == slackId) {
        console.log('DEBUG: email = ' + memberInfo.profile.email);
        return memberInfo.profile.email;
      }
    });

    return null;
  }
}

class GCalenderApi {
  
  createRadomId() {
    return Math.random().toString(36);
  }

  formatEmailJson(emails) {
    let jsonEmails = [];
    emails.forEach(email => {
      jsonEmails.push({email:email})
    });

    return jsonEmails;
  }

  createCalender(name: string, attendeeEmails, start, end) {
    const calendarId = "primary";
    const conferenceType = "hangoutMeet";
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

    // Create Calender
    return Calendar.Events.insert(calendarConfig, calendarId, { conferenceDataVersion: 1 });
}

// TODO: うまく実装できていない。（"DEBUG: slackIds = [function toString() { [native code] }]"のようにnative codeと表示されてしまう）
function array2string(arr: string[]): string {
  return '[' + arr.toString + ']';
}

function doPost(e) {
  // Get Environment Values
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_TOKEN");
  const meetingTime = parseInt(PropertiesService.getScriptProperties().getProperty("MEETING_TIME"));

  // Call API Classes
  let slackApi = new SlackApi(token);
  let gcalApi = new GCalenderApi();

  // Extract slack ids from args
  const args = e.parameter.text.split(' ');
  let slackIds: string[] = [];
  args.forEach(arg => {
    console.log(arg.replace('@', ''));
    slackIds.push(arg.replace('@', ''));
  });
  console.log('DEBUG: slackIds = ' + array2string(slackIds));

  // Get Emails by Slack IDs
  // TODO: attendeeEmailsにEmailが入らない（slackApi.getEmailBySlackId(id)の中ではEmailは取得できている）
  let attendeeEmails: string[] = [];
  slackIds.forEach((id) => {
    attendeeEmails.push(slackApi.getEmailBySlackId(id));
  });
  console.log('DEBUG: attendeeEmails = ' + array2string(attendeeEmails));

  // Get time 
  const nowTime = new Date();
  let start = nowTime.getFullYear() + '/' + String(parseInt(nowTime.getMonth())+1) + '/' + nowTime.getDate() + ' ' + nowTime.getHours() +':'+ nowTime.getMinutes() + ':' + nowTime.getSeconds();
  nowTime.setMinutes(nowTime.getMinutes() + meetingTime);
  let end = nowTime.getFullYear() + '/' + String(parseInt(nowTime.getMonth())+1) + '/' + nowTime.getDate() + ' ' + nowTime.getHours() +':'+ nowTime.getMinutes() + ':' + nowTime.getSeconds();

  // Create Calendar if attendee Email is existed
  if (attendeeEmails.length){
    const calendarObj = gcalApi.createCalender("TMP MTG", attendeeEmails, start, end);
    const request2slack = {
      response_type : "in_channel", // Visible all users in channel
      text: su + ' ' + calendarObj.hangoutLink
    };
  } else {
    const request2slack = { text: "ERROR: cannot find users."};
  }
  return ContentService.createTextOutput(JSON.stringify(request2slack)).setMimeType(ContentService.MimeType.JSON);
}