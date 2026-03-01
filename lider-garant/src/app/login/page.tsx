"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import LottieHero from "@/components/LottieHero";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginApi, type LoginData } from "@/api/auth";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginApi(values as LoginData);
      if (result.success) {
        // Login successful — auth context handles redirect
      } else {
        setError(result.message || "Ошибка входа");
      }
    } catch (err) {
      setError("Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  const [show, setShow] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
      <Card className="border border-foreground/10 bg-background/90 backdrop-blur-xl shadow-2xl transition-all hover:shadow-3xl">
        <CardContent className="p-6 md:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-3xl font-semibold text-foreground">
                Вход
              </h1>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                              className="h-12 rounded-xl bg-background border border-foreground/10 pl-10 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Пароль
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                            <Input
                              type={show ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 rounded-xl bg-background border border-foreground/10 pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShow((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                            >
                              {show ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-foreground/70">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-foreground/30 bg-background"
                      />
                      Запомнить меня
                    </label>
                    <Link href="#" className="text-sm link-gradient">
                      Забыли пароль?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-primary text-white shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Вход..." : "Войти"}
                  </Button>
                  <p className="text-sm text-foreground/70 text-center">
                    Нет аккаунта?{" "}
                    <Link
                      href="/register"
                      className="link-gradient font-medium"
                    >
                      Зарегистрироваться
                    </Link>
                  </p>
                </form>
              </Form>
            </div>

            <div className="relative hidden lg:block rounded-3xl border border-foreground/10 bg-background/40 overflow-hidden min-h-[260px] md:min-h-[360px]">
              <LottieHero src="/Login.json" className="absolute inset-0" />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
