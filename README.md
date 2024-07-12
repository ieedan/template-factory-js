<div align="center">
  <img src="https://github.com/user-attachments/assets/5b77a29a-7a9f-4f45-bb9a-1a2810963bcd">
</div>

# template-factory-js

```bash
npm install template-factory
```

An unreasonably easy way to create distributable project templates.

## What is this?

Template factory is a package you install to help you scaffold a template application.

It provides a consistent way to structure your CLI application as well as helpful features such as
file exclusions or replacements.

## Getting Started

This will take you though setting up a basic SvelteKit template. Don't worry you won't need to know
anything about SvelteKit to complete the tutorial.

The complete code for this guide is under
[/examples/guide](https://github.com/ieedan/template-factory-js/tree/main/examples/guide).

To start we will initialize a new templates project

```bash
npm init -y
```

> [!NOTE] 
> Make sure to add `"type": "module",` to your package.json

Setup the file structure

```
my-template-project
├── templates
│   └── sveltekit
│       ...
├── src
│   └── index.ts
├── package.json
└── REAME.md
```

This structure is optional but recommended to keep things organized.

Your project templates will go under `/templates` in this case we have a `sveltekit` template that
we have initialized using `npm create svelte@latest`.

Lets make it so we can install this template.

Start by installing **template-factory-js**

```bash
npm install template-factory
```

Next lets write the program in `index.js`

```js
import { create } from 'template-factory';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        path: 'templates/sveltekit',
        flag: 'sveltekit',
      },
    ],
  });
};

main();
```

Now run

```bash
node src/index.js
```

Now you should see the CLI

```bash
┌   guide  v1.0.0
│
◆  Where should we create the project?
│   (hit Enter to use current directory)
└
```

The user can now enter what they want to call the project and the project will be created for them.

The user can also run

```bash
# passes `my-project` as the name of the project
node src/index.js my-project
```

This skips `Where should we create the project?` prompt and creates the project with the specified
name.

But right now this really doesn't do anything so lets add some features!

Lets add a feature for `@threlte`.

To do this we will need to add a [prompt](#prompts)!

```js
// we add execa here to make command execution easy
import { execa } from 'execa';
import { create } from 'template-factory';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        path: 'templates/sveltekit',
        flag: 'sveltekit',
        prompts: [
          {
            kind: 'confirm',
            message: 'Would you like to install @threlte?',
            yes: {
              run: async ({ dir }) => {
                await execa({ cwd: dir })`npm install three @threlte/core`;
              },
              startMessage: 'Installing @threlte',
              endMessage: 'Installed @threlte',
            },
          },
        ],
      },
    ],
  });
};

main();
```

Now when you run `node src/index.js test` again it should look like this:

```bash
┌   guide  v1.0.0
│
◇  Created test
│
◆  Would you like to install @threlte?
│  ○ Yes / ● No
└
```

To see more about prompts check our [API Reference](#api-reference)

## Examples

We provide some [basic examples](https://github.com/ieedan/template-factory-js/tree/main/src) with
the project to get you started but if you want to see full scale examples you should check out the
[Community Examples](#community-examples)

## Community Examples

Here are some examples of the power of **template-factory-js**. If you would like to contribute one
let us know 😉!

- [@ieedan/templates](https://github.com/ieedan/templates) Personal project templates for
  [@ieedan](https://github.com/ieedan)

## API Reference

Any documentation for this library you'll find here! If anythings missing or unclear feel free to
open an [issue](https://github.com/ieedan/template-factory-js/issues/new).

### Multiple templates

To have multiple templates in a single project just add them to the array! **template-factory-js**
will prompt the user and ask them what template they want to use once you have more than one
template.

### Prompts

Prompts are a huge part of what makes **template-factory** useful. It makes defining features and
options to add to your templates extremely easy.

For example what if we wanted to optionally add a dependency to a package?

It would look something like this:

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      prompts: [
        {
          kind: 'confirm',
          message: 'Would you like to install lodash?',
          // set initial value for the prompt
          initialValue: false,
          yes: {
            // run your code here
            run: async ({ dir }) => {
              // install lodash
            },
            // shown while awaiting `run`
            startMessage: 'Installing lodash',
            // shown once `run` is done
            endMessage: 'Installed lodash',
          },
        },
      ],
    },
  ],
});
```

This is pretty useful on its own but what if we want to install a package that may have plugins or
other supporting dependencies? Then we would want to ask the user if they want to install those as
well.

To create a prompt dependent on the result of another prompt we can return more prompts as the
result of the `run` function of the original prompt.

For instance installing `@threlte`:

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      prompts: [
        {
          kind: 'multiselect',
          message: 'What features should be included?',
          options: [
            {
              name: 'Threlte',
              select: {
                run: async ({ dir }) => {
                  // install threlte

                  // return an array of prompts to run
                  return [
                    {
                      message: 'Do you want to install any other @threlte packages?',
                      kind: 'multiselect',
                      options: [
                        '@threlte/extras',
                        '@threlte/gltf',
                        '@threlte/rapier',
                        '@threlte/theatre',
                        '@threlte/xr',
                        '@threlte/flex',
                      ].map((pack) => ({
                        name: pack,
                        select: {
                          run: async ({ dir }) => {
                            // install package
                          },
                          startMessage: `Installing ${pack}`,
                          endMessage: `Installed ${pack}`,
                        },
                      })),
                    },
                  ];
                },
                startMessage: 'Installing @threlte/core, three, and @types/three',
                endMessage: 'Installed Threlte',
              },
            },
          ],
        },
      ],
    },
  ],
});
```

### Copy Completed

**template-factory** exposes a callback on every template called `copyCompleted` this is called with
the working directory and project name once the template files have been copied over but before any
prompts have been run.

This is a good place to generate files or do other work that is dependent on the directories being
there but not optional to the user.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      copyCompleted: async ({ dir, projectName }) => {
        const file = path.join(dir, 'README.md');

        const content = `# ${projectName}`;

        await fs.writeFile(file, content);
      },
    },
  ],
});
```

### Replace file content

Sometimes you want to replace the content of a file such as the name of the project in a package
config file.

**template-factory** provides an api for you to do this through the `templateFiles` property on a
template.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      templateFiles: [
        {
          // path to the file you want to make the replacement
          path: 'package.json',
          replacements: [
            {
              // matches this
              match: 'template-name',
              // replace with this
              replace: ({ projectName }) => projectName,
            },
          ],
        },
      ],
    },
  ],
});
```

Your replacements have a `match` property and a `replace` function.

The match property specifies the text that should be replaced.

The replace function should return the text to replace it with. It also calls with the `projectName`
and `dir` (working directory) so that you can use those to make your replacements.

### Prevent files from being copied

Sometimes there are files in your template that you don't want to copy to the users project for
whatever reason.

One way to do this is to include them in the `.gitignore` file. **template-factory** respects the
`.gitignore` by default preventing ignored files from being copied.

However sometimes you may want those files to be committed.

In that case you can provide the `excludeFiles` property on the template.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...,
      excludeFiles: ['DONOTCOPY.js'],
    },
  ],
});
```

### Personalization

Sometimes you may want to customize your app so that it gives the look you want. While
**template-factory** doesn't currently provide many ways to do this in the program it does provide
customization for the `intro` and `outro` messages.

```js
await create({
  //...
  templates: [
    //...
  ],
  customization: {
    intro: async ({ appName, version }) => {
      const name = color.bgHex('#0000ff').white(` ${appName} `);
      const ver = color.gray(` v${version} `);
      return name + ver;
    },
    outro: async ({}) => {
      return color.green('All done!');
    },
  },
});
```
