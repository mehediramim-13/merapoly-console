import { SiC, SiCplusplus, SiJavascript, SiPython } from "react-icons/si";
import { FaJava } from "react-icons/fa6";

export const LANGUAGES = [
  {
    id: "c",
    name: "C",
    version: "GCC",
    ext: "c",
    monaco: "c",
    hljs: "c",
    color: "#7ea6ff",
    Icon: SiC,
    runtime: "server",
    defaultName: "main",
    stdinHint: "Read by scanf(), getchar(), fgets()…",
    template: String.raw`#include <stdio.h>

int main(void) {
    printf("Hello from MeRa Poly!\n");

    for (int i = 1; i <= 5; i++) {
        printf("%d x %d = %d\n", i, i, i * i);
    }
    return 0;
}
`,
    snippets: [
      {
        title: "Hello World",
        desc: "The classic first program",
        code: String.raw`#include <stdio.h>

int main(void) {
    printf("Hello, World!\n");
    return 0;
}
`,
      },
      {
        title: "Read input",
        desc: "scanf with the Input panel",
        stdin: "MeRa 21",
        code: String.raw`#include <stdio.h>

int main(void) {
    char name[64];
    int age;

    printf("Enter name and age: ");
    scanf("%63s %d", name, &age);
    printf("\nHi %s, next year you will be %d!\n", name, age + 1);
    return 0;
}
`,
      },
      {
        title: "Fibonacci",
        desc: "First 15 numbers",
        code: String.raw`#include <stdio.h>

int main(void) {
    long long a = 0, b = 1;

    for (int i = 0; i < 15; i++) {
        printf("%lld ", a);
        long long next = a + b;
        a = b;
        b = next;
    }
    printf("\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: "cpp",
    name: "C++",
    version: "C++17",
    ext: "cpp",
    monaco: "cpp",
    hljs: "cpp",
    color: "#38bdf8",
    Icon: SiCplusplus,
    runtime: "server",
    defaultName: "main",
    stdinHint: "Read by cin, getline(), scanf()…",
    template: String.raw`#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int main() {
    cout << "Hello from MeRa Poly!" << endl;

    vector<int> v = {1, 2, 3, 4, 5};
    int sum = accumulate(v.begin(), v.end(), 0);
    cout << "Sum = " << sum << endl;
    return 0;
}
`,
    snippets: [
      {
        title: "Hello World",
        desc: "The classic first program",
        code: String.raw`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
      },
      {
        title: "Read input",
        desc: "cin with the Input panel",
        stdin: "MeRa 21",
        code: String.raw`#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;
    cout << "Enter name and age: ";
    cin >> name >> age;
    cout << "\nHi " << name << ", next year you will be " << age + 1 << "!" << endl;
    return 0;
}
`,
      },
      {
        title: "Sort & print",
        desc: "STL vector + sort",
        code: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {42, 7, 19, 3, 88, 25};
    sort(nums.begin(), nums.end());

    for (int n : nums) cout << n << " ";
    cout << endl;
    return 0;
}
`,
      },
    ],
  },
  {
    id: "java",
    name: "Java",
    version: "OpenJDK",
    ext: "java",
    monaco: "java",
    hljs: "java",
    color: "#ff9a4d",
    Icon: FaJava,
    runtime: "server",
    defaultName: "Main",
    stdinHint: "Read by Scanner, BufferedReader…",
    template: String.raw`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from MeRa Poly!");

        for (int i = 1; i <= 5; i++) {
            System.out.println(i + " squared = " + (i * i));
        }
    }
}
`,
    snippets: [
      {
        title: "Hello World",
        desc: "The classic first program",
        code: String.raw`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
      },
      {
        title: "Read input",
        desc: "Scanner with the Input panel",
        stdin: "MeRa 21",
        code: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter name and age: ");
        String name = sc.next();
        int age = sc.nextInt();
        System.out.println("\nHi " + name + ", next year you will be " + (age + 1) + "!");
    }
}
`,
      },
      {
        title: "ArrayList & streams",
        desc: "Modern Java collections",
        code: String.raw`import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
        List<Integer> evens = nums.stream()
                .filter(n -> n % 2 == 0)
                .map(n -> n * n)
                .collect(Collectors.toList());
        System.out.println("Even squares: " + evens);
    }
}
`,
      },
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    version: "ES2024",
    ext: "js",
    monaco: "javascript",
    hljs: "javascript",
    color: "#facc15",
    Icon: SiJavascript,
    runtime: "browser",
    defaultName: "script",
    stdinHint: "Read with prompt() — each call returns the next line.",
    template: String.raw`// 🚀 Welcome to MeRa Poly — write JavaScript, press Ctrl + Enter

const greet = (name) => "Hello, " + name + "! 👋";
console.log(greet("World"));

const users = [
  { id: 1, name: "Aria", role: "Designer" },
  { id: 2, name: "Zane", role: "Engineer" },
];
console.table(users);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.info("Crunching numbers...");
  await sleep(400);
  console.log("Squares:", [1, 2, 3, 4, 5].map((n) => n ** 2));
  console.warn("This is a warning");
}

await main(); // top-level await works!
`,
    snippets: [
      {
        title: "Hello World",
        desc: "The classic first program",
        code: String.raw`console.log("Hello, World!");
`,
      },
      {
        title: "Async / await",
        desc: "Promises with delays",
        code: String.raw`const wait = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

console.time("total");
const [a, b, c] = await Promise.all([
  wait(300, "alpha"),
  wait(200, "beta"),
  wait(100, "gamma"),
]);
console.log(a, b, c);
console.timeEnd("total");
`,
      },
      {
        title: "Read input",
        desc: "prompt() with the Input panel",
        stdin: "MeRa\n21",
        code: String.raw`const name = prompt("Your name?");
const age = Number(prompt("Your age?"));
console.log("Hi " + name + ", next year you will be " + (age + 1) + "!");
`,
      },
      {
        title: "Classes, Map & Set",
        desc: "Modern JS data structures",
        code: String.raw`class Counter {
  #count = 0;
  inc() { return ++this.#count; }
}

const c = new Counter();
c.inc(); c.inc();
console.log("count:", c.inc());

const map = new Map([["a", 1], ["b", 2]]);
const set = new Set([1, 2, 2, 3, 3, 3]);
console.log(map);
console.log(set);
`,
      },
    ],
  },
  {
    id: "python",
    name: "Python",
    version: "3.x",
    ext: "py",
    monaco: "python",
    hljs: "python",
    color: "#60a5fa",
    Icon: SiPython,
    runtime: "server",
    defaultName: "main",
    stdinHint: "Read by input(), sys.stdin…",
    template: String.raw`def greet(name: str) -> str:
    return f"Hello, {name}!"


print(greet("MeRa Poly"))

squares = [n ** 2 for n in range(1, 6)]
print("Squares:", squares)
`,
    snippets: [
      {
        title: "Hello World",
        desc: "The classic first program",
        code: String.raw`print("Hello, World!")
`,
      },
      {
        title: "Read input",
        desc: "input() with the Input panel",
        stdin: "MeRa\n21",
        code: String.raw`name = input("Your name? ")
age = int(input("Your age? "))
print(f"Hi {name}, next year you will be {age + 1}!")
`,
      },
      {
        title: "Fibonacci",
        desc: "Generator version",
        code: String.raw`def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


gen = fib()
print([next(gen) for _ in range(15)])
`,
      },
    ],
  },
];

export const LANG_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));

export const EXT_TO_LANG = {
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  java: "java",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
};

export function detectJavaClass(code) {
  const m = code.match(
    /public\s+(?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/
  );
  return m ? m[1] : null;
}

export function fileNameFor(lang, base, code) {
  if (lang.id === "java") return `${detectJavaClass(code) || "Main"}.java`;
  const clean = (base || lang.defaultName).replace(/[^\w\-]/g, "") || lang.defaultName;
  return `${clean}.${lang.ext}`;
}
