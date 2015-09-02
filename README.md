# cerberus

`npm i -g git+ssh://git@github.com/dresources/cerberus.git`

## config

add a config file to `/usr/local/cerberus/conf.d/` that looks like:

```
{
    "watch": "/Users/jwhitmarsh/src/lamp",
    "extractPathPattern": "/lamp-backend*",
    "tarPattern": "lamp-frontend-dist-(\\d\\.){3}tar\\.gz"
}
```

## run

with [forever](https://github.com/foreverjs/forever) or [pm2](https://github.com/Unitech/PM2)
