import {addBinderComment} from '../src/binder'
import nock from 'nock'

beforeEach(() => {
  nock.disableNetConnect()
})

afterEach(() => {
  if (!nock.isDone()) {
    nock.cleanAll()
    throw new Error('Not all nock calls were made')
  }
})

const mockParams = {
  binderUrl: 'https://mybinder.org',
  token: 'token',
  owner: 'owner',
  repo: 'repo',
  query: null
}

const binderComment1 =
  '[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/owner/repo/abcdef1) :point_left: Launch a binder notebook on this branch for commit abcdef1'
const fullComment1 = `${binderComment1}\n\nI will automatically update this comment whenever this PR is modified`

test('add new comment', async () => {
  nock('https://api.github.com')
    .get('/repos/owner/repo/pulls/1')
    .reply(200, {
      head: {
        repo: {
          full_name: 'owner/repo'
        },
        sha: 'abcdef1'
      }
    })
  nock('https://api.github.com')
    .get('/repos/owner/repo/issues/1/comments')
    .reply(200, [
      {
        id: 12,
        user: {
          login: 'github-actions[bot]'
        },
        body: 'something else'
      },
      {
        id: 34,
        user: {
          login: 'someone-else'
        },
        body: 'something else'
      }
    ])
  nock('https://api.github.com')
    .post('/repos/owner/repo/issues/1/comments', {body: fullComment1})
    .reply(200)

  const c = await addBinderComment({
    ...mockParams,
    prNumber: 1
  })
  expect(c).toBe(binderComment1)
})

const binderComment2 =
  '[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/owner/repo/9876543) :point_left: Launch a binder notebook on this branch for commit 9876543'
const fullComment2 = `${fullComment1}\n\n${binderComment2}`

test('update existing comment', async () => {
  nock('https://api.github.com')
    .get('/repos/owner/repo/pulls/2')
    .reply(200, {
      head: {
        repo: {
          full_name: 'owner/repo'
        },
        sha: '9876543'
      }
    })
  nock('https://api.github.com')
    .get('/repos/owner/repo/issues/2/comments')
    .reply(200, [
      {
        id: 56,
        user: {
          login: 'github-actions[bot]'
        },
        body: fullComment1
      },
      {
        id: 78,
        user: {
          login: 'someone-else'
        },
        body: 'something else'
      }
    ])
  nock('https://api.github.com')
    .patch('/repos/owner/repo/issues/comments/56', {body: fullComment2})
    .reply(200)

  const c = await addBinderComment({
    ...mockParams,
    prNumber: 2
  })
  expect(c).toBe(binderComment2)
})

test('add new lab comment', async () => {
  const binderLabComment =
    '[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/owner/repo/a1b2c3d?urlpath=lab) :point_left: Launch a binder notebook on this branch for commit a1b2c3d'
  const fullLabComment = `${binderLabComment}\n\nI will automatically update this comment whenever this PR is modified`

  nock('https://api.github.com')
    .get('/repos/owner/repo/pulls/3')
    .reply(200, {
      head: {
        repo: {
          full_name: 'owner/repo'
        },
        sha: 'a1b2c3d'
      }
    })
  nock('https://api.github.com')
    .get('/repos/owner/repo/issues/3/comments')
    .reply(200, [
      {
        id: 90,
        user: {
          login: 'someone-else'
        },
        body: 'something else'
      }
    ])
  nock('https://api.github.com')
    .post('/repos/owner/repo/issues/3/comments', {body: fullLabComment})
    .reply(200)

  const c = await addBinderComment({
    ...mockParams,
    prNumber: 3,
    query: 'urlpath=lab'
  })
  expect(c).toBe(binderLabComment)
})
