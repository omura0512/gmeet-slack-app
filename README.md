# 概要
Google Apps ScriptとSlack APIを利用して、Slack上でSlashコマンドでGoogle MeetのURLを自動で吐き出すことのできるアプリ。
![image](https://user-images.githubusercontent.com/58808097/138828237-2c7aeb93-c2bf-44c9-a038-73b86d86998a.png)

# 使い方
## Slashコマンド
`/meet @user1 @user2`とSlackに打ち込むことで、参加者を選択してGoogleMeetのURLを生成できる。

## GAS関連
makeコマンドを利用して、CloneやPushなどを行う。
| コマンド         | 概要                                                                                                                | 
| :--------------- | :------------------------------------------------------------------------------------------------------------------ | 
| make clasp-init  | 必ず最初に実行する。<br>標準出力に出力されるURLを踏んで、取得したアクセスコードをコンソールに入力する。                 | 
| make clasp-clone | 認証したアカウントのGASプロジェクトをsrcディレクトリ配下にCloneする。<br>Cloneしたいプロジェクトを選択してEnterを押す。 | 
| make clasp-push  | srcディレクトリ配下のコードをGASプロジェクトにPushする。<br>Conflictなどは気にせずPushするので要注意。                  | 
| make clasp-pull  | GASプロジェクトのコードをsrcディレクトリ配下にPullする。<br>Conflictなどは気にせずPullするので要注意。                  | 

# 導入手順
## 1. Slack APIの設定
[こちらのページ](https://qiita.com/sskmy1024y/items/0ec5b61a7cfeb8563576)をもとに、SlackのSlashコマンドを設定する。

## 2. GASのデプロイ
GASのプロジェクトをWEBページで作成する。
その後、以下のコマンドを実行する
```
$ make clasp-init
<リンクを踏んで、アクセスコードをコピペ>
$ make clasp-clone
<先ほど作成したプロジェクトを選択する>
$ rm src/コード.js
```

## 3. GASの設定
[こちらのページ](https://qiita.com/Massasquash/items/2209ff367d65c5dd6181)を参考に、以下を環境変数として入力する。
- `SLACK_TOKEN: <Slack APIでAppを作成した時に取得したOAuth Token>`
- `MEETING_TIME: <ミーティングの基本時間。単位は分（例：30）>`

次に、このGASプロジェクトをWEBアプリとして公開する。
アプリの公開は`公開 > WEBアプリケーションとして公開`で行える。
詳細は[こちらのページ](https://qiita.com/sskmy1024y/items/0ec5b61a7cfeb8563576)を参照してください。

公開が終了したら、表示されるリンクをコピーしてください。
コピーしたリンクを作成したSlack Appに紐づけたら作業終了です。
