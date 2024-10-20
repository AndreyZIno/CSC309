/*
  Warnings:

  - You are about to drop the `CodeTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlogPostTags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlogPostTemplates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TemplateTags` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tags` to the `BlogPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tag_name_key";

-- DropIndex
DROP INDEX "_BlogPostTags_B_index";

-- DropIndex
DROP INDEX "_BlogPostTags_AB_unique";

-- DropIndex
DROP INDEX "_BlogPostTemplates_B_index";

-- DropIndex
DROP INDEX "_BlogPostTemplates_AB_unique";

-- DropIndex
DROP INDEX "_TemplateTags_B_index";

-- DropIndex
DROP INDEX "_TemplateTags_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CodeTemplate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Comment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BlogPostTags";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BlogPostTemplates";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TemplateTags";
PRAGMA foreign_keys=on;

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
    CONSTRAINT "BlogPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("description", "id", "numDownvotes", "numUpvotes", "title", "userId") SELECT "description", "id", "numDownvotes", "numUpvotes", "title", "userId" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
