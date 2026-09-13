import codecs

with codecs.open('backend/src/main/resources/application.yml', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"', 'redirect-uri: "http://localhost:8888/login/oauth2/code/{registrationId}"')

with codecs.open('backend/src/main/resources/application.yml', 'w', 'utf-8') as f:
    f.write(content)
