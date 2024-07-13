<div align="center">
  <img src="https://github.com/user-attachments/assets/5b77a29a-7a9f-4f45-bb9a-1a2810963bcd">
</div>

# template-factory-js

```bash
npm install template-factory
```

An unreasonably easy way to create distributable project templates.

## What is this?

**template-factory** is a package you install to help you scaffold a template application.

It provides a consistent way to structure your CLI application as well as helpful features such as
file exclusions or replacements.

## Getting Started

This will take you though setting up a basic SvelteKit template. Don't worry you won't need to know
anything about SvelteKit to complete the tutorial.

The complete code for this guide is under
[/examples/javascript](https://github.com/ieedan/template-factory-js/tree/main/examples/javascript).

The easiest way to get started is to use a template.
[@iedan/create](https://github.com/ieedan/create) has a template for this.

```bash
npx @iedan/create -t template-factory
```

Take the path for JavaScript and you'll end up with a file structure like this:

```
my-template-project
├── templates
│   └── notes
│       └── NOTES.md
├── ...
├── bin.mjs
└── package.json
```

Delete the notes directory and lets create the SvelteKit project instead:

```bash
# under ./templates
npm create svelte@latest sveltekit
```

Next lets write the program in `bin.mjs` (If you are using TypeScript then `index.ts`).

```js
#!/usr/bin/env node
import { create, util } from 'template-factory';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        // we have to pass it this way so that it resolves correctly in production
        path: util.relative('templates/sveltekit', import.meta.url),
        flag: 'sveltekit',
      },
    ],
  });
};

main();
```

Now run

```bash
npm run start
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
npm run start my-project
```

This skips `Where should we create the project?` prompt and creates the project with the specified
name.

But right now this really doesn't do anything so lets add some features!

Lets add a feature for `@threlte`.

To do this we will need to add a [prompt](#prompts)!

```js
#!/usr/bin/env node
// we add execa here to make command execution easy
import { execa } from 'execa';
import { create, util } from 'template-factory';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        // we have to pass it this way so that it resolves correctly in production
        path: util.relative('templates/sveltekit', import.meta.url),
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

Now when you run the program again it should look like this:

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

We provide some [basic examples](https://github.com/ieedan/template-factory-js/tree/main/examples)
with the project to get you started but if you want to see full scale examples you should check out
the [Community Examples](#community-examples)

## Community Examples

Here are some examples of the power of **template-factory-js**. If you would like to contribute one
let us know 😉!

- [@iedan/create](https://github.com/ieedan/create) Personal project templates for
  [@ieedan](https://github.com/ieedan)

## API Reference

Any documentation for this library you'll find here! If anythings missing or unclear feel free to
open an [issue](https://github.com/ieedan/template-factory-js/issues/new).

### Templates
When creating a template you must provide a name, flag and either the path or repo property.

```ts
export type Template = {
  // Name of the template
  name: string;
  // local path to the template
  path?: string;
  // git repository EX: https://github.com/ieedan/create.git
  repo?: string;
  // what should the value of the flag be to select this template
  flag: string;
  // do not include these files in the new project
  excludeFiles?: string[];
  // Show user prompts to add options or features
  prompts?: Prompt[];
  // If you want to make replacements to content of the files
  templateFiles?: TemplateFile[];
  // Runs once the files have been copied to the specified directory
  copyCompleted?: (opts: TemplateOptions) => Promise<void>;
};
```

### Multiple templates

To have multiple templates in a single project just add them to the array! **template-factory-js**
will prompt the user and ask them what template they want to use once you have more than one
template.

### Prompts

Prompts are a huge part of what makes **template-factory** useful. It makes defining features and
options to add to your templates extremely easy.

#### Prompt Kinds

There are currently three kinds of prompts:

- **confirm** - yes or no
- **multiselect** - select zero, one, or multiple of the provided options
- **select** - select one of the provided options

When creating a prompt you add it to the list of prompts for your template:

```ts
await create({
  //...
  templates: [
    {
      //...
      prompts: [
        // add your prompt here
      ],
    },
  ],
});
```

You must specify the kind of prompt and a message for the prompt to display (should be a question).

```js
prompts: [
  {
    kind: 'confirm',
    message: 'Would you like to install lodash?',
  },
],
```

Once you have done that you need to specify the code that will run when an option is selected.

For **confirm** prompts that should look like this:

```js
{
  kind: 'confirm',
  message: 'Would you like to install lodash?',
  // set initial value for the prompt
  initialValue: false,
  // what to do on `yes`
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
  // what to do on `no`
  no: {
    // structure is the same as yes
  },
}
```

For **select** and **multiselect** prompts your code should look like this:

```js
{
  kind: 'multiselect', // or multiselect
  message: 'What features should we include?',
  // set initial value for the prompt
  initialValue: ["prettier"],
  options: [
    {
      name: "prettier",
      // what to do when selected
      select: {
        run: async ({ dir }) => {
          // install prettier
        },
        // shown while awaiting `run`
        startMessage: 'Installing prettier',
        // shown once `run` is done
        endMessage: 'Installed prettier',
      }
    },
    {
      name: "eslint",
      // what to do when selected
      select: {
        run: async ({ dir }) => {
          // install eslint
        },
        // shown while awaiting `run`
        startMessage: 'Installing eslint',
        // shown once `run` is done
        endMessage: 'Installed eslint',
      }
    }
  ]
}
```

#### Recursive Prompts

Recursive prompts allow you to run prompts on prompts. This is useful when you would like to create
prompts that will only be shown to the user if a specific selection is made.

To do this you return more prompts from the `run` function of the parent prompt.

The result looks something like this:

```js
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

### Handling Errors

Handling errors is somewhat difficult thanks to the way they work in JavaScript as well as
commanders overrides.

Because of this in any of the functions defined by you such as `copyCompleted` or `run` functions we
pass an `error` function to allow you to write to the error console and stop program execution.

That looks something like this:

```ts
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      // add error function
      copyCompleted: async ({ dir, projectName, error }) => {
        const file = path.join(dir, 'README.md');

        // handle error on code that can error
        await fs.readFile(file, content).catch((err) => error(err));
      },
    },
  ],
});
```

### Util

Util contains necessary utilities to use the package.

#### util.relative

This function helps make sure your paths to your templates or other files that should be located
based on the directory of your project are resolved correctly.

```ts
await create({
  //..
  templates: [
    {
      name: 'SvelteKit',
      // resolves to the absolute path for templates/sveltekit
      path: util.relative('templates/sveltekit', import.meta.url),
      flag: 'sveltekit',
    },
  ],
});
```
