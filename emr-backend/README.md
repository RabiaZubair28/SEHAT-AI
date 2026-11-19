## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Database migrations

Production must use migrations only. Keep `synchronize: false`, commit every file in
`src/migrations`, and run pending migrations before starting the new app version.

```bash
# after changing entities, generate a named migration
$ npm run migration:generate -- --name=AddPatientStatus

# review the generated SQL, then commit it with the entity/code change
$ npm run migration:check

# show pending/executed migrations against the configured database
$ npm run migration:show

# apply pending migrations
$ npm run migration:run

# mark already-applied schema changes as executed without running SQL
$ npm run migration:run:fake

# revert only the latest migration when you intentionally need rollback
$ npm run migration:revert
```

For an existing production database that already has the schema from an old
manual change, do not run that old migration normally. First compare the
migration SQL with production, confirm the schema is already present, then run
`npm run migration:run:fake` once to record it in TypeORM's `migrations` table.
After that baseline, use normal `npm run migration:run` for every new change.

Recommended deployment order:

1. Back up the production database or confirm a recent restore point exists.
2. Deploy the build artifact that includes the new committed migration files.
3. Run `npm run migration:show` against production and confirm only expected migrations are pending.
4. Run `npm run migration:run` exactly once.
5. Start or restart the application.

Use `npm run migration:check` in CI after entity changes. It exits with a failure
when TypeORM detects schema changes that are not represented by a migration.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Irtaza, Ahmed]

## License

Government of Sindh (Health Department)
