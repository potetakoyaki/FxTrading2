1. zipを解凍
2. workspaceへ移動
3. インポート-> maven -> 既存プロジェクトをインポート
  - pom.xmlの1行目にエラーが表示される場合はeclipseプラグインの更新が必要
  - [ヘルプ] -> [新規ソフトウェアのインストール] -> [https://teratail.com/questions/192767]
4. DBの作成
  1. MySQLにアクセス
  2. DBを新規作成（DB名: forum）
  3. DBをforumに切り替え
  4. src/main/resources/forum_2020-11-02.sqlをローカルのMySQLにインポートする
  5. 参考(https://qiita.com/ydzum1123/items/219d8e60843a678be719)
5. application.propertiesの作成
  1. src/main/resources/application.properties_templateを同階層に複製する。ファイル名はapplication.propertiesとする
  2. [spring.datasource.username=root]のroot部分を自分のMySQLのユーザー名に変更
  3. [spring.datasource.password=パスワード]のパスワード部分を自分のMySQLのパスワードに変更
