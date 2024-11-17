/*
  Warnings:

  - You are about to drop the column `numReports` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `numReports` on the `Comment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "numUpvotes" INTEGER NOT NULL DEFAULT 0,
    "numDownvotes" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("createdAt", "description", "id", "numDownvotes", "numUpvotes", "tags", "title", "userId") SELECT "createdAt", "description", "id", "numDownvotes", "numUpvotes", "tags", "title", "userId" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "blogPostId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "numUpvotes" INTEGER NOT NULL DEFAULT 0,
    "numDownvotes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("blogPostId", "content", "createdAt", "id", "numDownvotes", "numUpvotes", "parentId", "userId") SELECT "blogPostId", "content", "createdAt", "id", "numDownvotes", "numUpvotes", "parentId", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
