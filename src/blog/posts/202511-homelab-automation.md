---
date: 2025-11-24
title: 'How I Automated my Homelab'
tags:
  - homelab
comment: true
---

I've been homelabbing since pretty much forever at this point. From the first file server running on an ancient Thinkpad with a USB drive attached to my multi-node Proxmox cluster, it's been quite the journey. But what arguably was one of the most significant upgrades to my homelab as a whole wasn't related to hardware, but software. Specifically: Automation!

---

When everything was just one machine, it wasn't all that hard to work with. Log in, do some changes, fiddle with it for two hours, and be done with it. But then, I wanted to add more. Have a file server hosting my network drives. Why not play around with Active Directory, since my uni had access to free educational licenses to Windows Server (and the trial licenses are very generous anyway). Proxmox is now really popular, so let's have that. And oh look, I found this cheap server on my online market place of choice. And suddenly, you have your own little data center and are "stuck" with managing multiple different machines with different configurations, forget to patch half of them, and you probably also forgot how you set that one app up six months ago. It's a mess! So, when I noticed that I had too many hosts to take care of, I started looking into this tool that everyone is talking about: [Ansible][ansible].

> If you already know Ansible, feel free to skip the next section, as I will give a quick intro into what Ansible is and how it works.

## What is Ansible?

I will spare you all the nitty gritty details of what Ansible is. In short, you write plays (a bit like scripts), which can then be executed on your inventory (basically a list of servers), all at once in parallel, one after another, or a mix of the two. But instead of writing a bunch of Bash scripts (which I also attempted at one point, didn't go well), Ansible plays are written in YAML and executed using a Python runtime. Ansible takes a more declarative approach. Your play basically specifies, how the target server should be set up, which packages should be installed, which files are supposed to be in what place, and so on. Let me give you a very simple example:

### A simple example: Install a package

Assume, I want the command line editor `micro` to be installed on all my systems. I could manually run `apt install micro` on each of my systems, or I could tell Ansible that I want `micro` installed, and it figures out how to do it:

```yaml
- name: "Install micro"
  hosts: all
  tasks:
    - name: "Ensure micro is installed"
      ansible.builtin.apt:
        name: micro
        state: present
```

This is a whole Ansible playbook, with one play called "Install micro", and one task called "Ensure micro is installed". Once executed, Ansible will:
- Connect to each machine via SSH
- Figure out its environment, OS, etc.
- Check if `micro` is installed
- and if not, **install it**.

My first use-case was to have a script that `apt update && apt upgrade`s all my machines and VMs, and with a bit of help from your local AI chat bot, I had a very basic playbook ready to run updates across all my systems. In general, I can recommend using an AI chat bot to get going with some of the basics. You can achieve some passable results quite quickly. However, I do recommend setting up a linter, to catch don'ts that AI tends to make. If you're using VS Code, I recommend the official [Ansible extension][vs-code-ansible] and a tool called [`ansible-lint`][ansible-lint], which in combination will highlight those don'ts quite quickly.

Once you start writing Ansible playbooks, you probably want to reuse some of your code. That is where "Roles" come in. Consider these roles like function calls in a programming language. You call a role, and provide it with some parameters, and it will run all the tasks contained within that role for you. A bit further down, I'll explain how I use them in my infrastructure setup.

## The infrastructure I'm managing

Over the years, I've accumulated (but also decommissioned!) quite a bit of stuff. As of 2025, this is my current setup:

- 1 TrueNAS Scale server storing my files
- 3 Proxmox servers (running in a pool / cluster) for running applications
- 30+ VMs and LXC containers, of which are
    - 3 Windows Servers running Active Directory Domain Controllers
    - and the rest being Debian servers, most of them running Dockerized applications

And on top, I have an off-site server at my parents house, where I store some of my off-site backups, which also wants to be managed.

You can probably see why automation became very important to me. Keeping all these updated, managing configuration changes, and all the other responsibilities you gain from running your own little data center, the last thing I wanna do is have my internet go out because of a config change I made and forgot about the next day.

## So how do I manage these?

My homelab is now condensed into a single Git repository, which describes my setup. For security, I won't publish this repository anywhere, but I can show you how it's structured, and some of the contents to illustrate my setup. Let's start with the file tree:

```
+ ansible  # <- all the ansible stuff
    + files  # <- auxiliary files for deployed apps
    + inv    # <- Ansible inventory
        + site_a
        + site_b
              hosts.yml  # <- list of all the hosts in this site
            + group_vars
                + homepage    # <- variables applied to only a subset of the hosts (within that group)
                    vars.yml  # <- encrypted variables
                    vault.yml # <- plain text variables
    + roles  # <- reusable roles
        + docker
        + homepage
        + pihole
        + smb
        + [...]
    + tasks  # <- repeating (semi-automated) tasks
        truenas_updates.yml
        [...]
      ansible_user.yml  # <- playbook to setup an ansible-dedicated user
      application_1.yml # <- setup application 1
      application_2.yml # <- setup application 2
      homepage.yml      # <- setup application "Homepage"
+ vms  # <- Terraform for setting up my VMs and containers
    + site_a
    + site_b
    + shared_modules
```

## Ansible Roles: Re-usable code blocks (an example)

These days, whenever I want to deploy a new application, the first thing I do is create a new Ansible Role for it. As an example, let's take my `homepage` role and look at its file tree again:

```
+ homepage
    + defaults
        main.yml
    + tasks
        config.yml
        container.yml
        main.yml
    + vars
        main.yml
```

The `homepage` role deploys a Homelab homepage using the [Homepage][homepage] project. It acts as my start page for my homelab with links to all the services it provides, gives some status information for some, _and_ simply looks nice. (If you're into homelabbing, you'll probably like this.) The project is hosted using Docker. This role assumes therefore, that the host it's going to be deployed on has Docker installed already, for which I have a separate role.

A role can contain numerous different folders for different things, but in this case we have three: `defaults`, `tasks`, and `vars`. Rather confusingly, `vars` actually contain non-overridable variables (some might call these "constants") for this role, where as `defaults` can be overridden by the caller of the role.

In this case, I put the Docker image name and some runtime options that aren't expected to change much in the `vars.yml` file.

```yaml
# vars/main.yml
homepage_image: 'ghcr.io/gethomepage/homepage'
homepage_uid: 1000
homepage_gid: 1000
```

In my `defaults.yml`, I put all the different parameters, I want to have. I'm not gonna explain all of them, but they're here to give you a feeling of how this can be used.

```yaml
# defaults/main.yml
homepage_version: 'latest'
homepage_hostname: 'homepage'
homepage_custom_assets: []
  # - from: 'file.txt'
  #   to: 'assets/file.txt'
homepage_template_assets: []
  # - from: 'file.txt.j2'
  #   to: 'assets/file.txt'
homepage_expose_port: false
homepage_port: 3000
homepage_network: 'homepage_net'
homepage_config_dir: /opt/homepage
homepage_host_domain: 'homepage.panda.local'
```

Next, under `tasks`, `main.yml` serves as the entry point. You can put all your tasks there, if you want to, but I decided to split everything up into logical groups, so my `main.yml` is rather short:

```yaml
# tasks/main.yml
---
- name: "Create Config"
  ansible.builtin.include_tasks: config.yml
- name: "Create Containers"
  ansible.builtin.include_tasks: container.yml
```

Creating a container is rather simple, as there are pre-made modules for Docker. There's some extra complications in there, as I provided some configuration options for assigning a Docker network and wether I want to expose the container or not. The reason this is necessary is, that I'm not running this container on a dedicated host, but on the same host as my reverse proxy. That reverse proxy doesn't need the Homepage container to be exposed at all if it's running within the same Docker network, therefore I punched in these settings, unless I want to expose the container for testing.

```yaml
# tasks/container.yml
- name: "Create Homepage Network"
  community.docker.docker_network:
    state: present
    name: '{{ homepage_network }}'

- name: "Calculate Exposed Ports"
  ansible.builtin.set_fact:
    non_exposed_ports: []
    exposed_ports: ["{{ homepage_port }}:3000"]

- name: "Calculate Exposed Ports"
  ansible.builtin.set_fact:
    effective_ports: '{{ exposed_ports if homepage_expose_port else non_exposed_ports }}'

- name: "Create Homepage Container"
  community.docker.docker_container:
    state: started
    name: '{{ homepage_hostname }}'
    hostname: '{{ homepage_hostname }}'
    image: '{{ homepage_image }}:{{ homepage_version }}'
    restart_policy: always
    network_mode: '{{ homepage_network }}'
    ports: '{{ effective_ports }}'
    volumes:
      - "{{ homepage_config_dir }}:/app/config"
      - "{{ homepage_config_dir }}/assets:/app/public/images"
    env:
      PUID: '{{ homepage_uid | quote }}'
      PGID: '{{ homepage_gid | quote }}'
      HOMEPAGE_ALLOWED_HOSTS: '{{ homepage_host_domain }}'
```

The more interesting bit however is stored in the `config.yml` task file:

```yml
# tasks/config.yml
---
- name: "Create Config Directory"
  become: true
  ansible.builtin.file:
    state: directory
    path: '{{ homepage_config_dir }}'
    owner: '{{ ansible_user }}'
    group: '{{ ansible_user }}'
    mode: '0775'
- name: "Create Assets Directory"
  become: true
  ansible.builtin.file:
    state: directory
    path: '{{ homepage_config_dir }}/assets'
    owner: '{{ ansible_user }}'
    group: '{{ ansible_user }}'
    mode: '0775'

- name: "Upload Config Files"
  loop: '{{ homepage_custom_assets }}'
  loop_control:
    label: '{{ item.from }} -> {{ item.to }}'
  ansible.builtin.copy:
    src: '{{ item.from }}'
    dest: '{{ homepage_config_dir }}/{{ item.to }}'
    owner: '{{ ansible_user }}'
    group: '{{ ansible_user }}'
    mode: '0600'

- name: "Upload Templated Config Files"
  loop: '{{ homepage_template_assets }}'
  loop_control:
    label: '{{ item.from }} -> {{ item.to }}'
  ansible.builtin.template:
    src: '{{ item.from }}'
    dest: '{{ homepage_config_dir }}/{{ item.to }}'
    owner: '{{ ansible_user }}'
    group: '{{ ansible_user }}'
    mode: '0600'
```

On the surface, it just creates some folders and files, but `ansible.builtin.template` is quite powerful: It allows you to generate a file from a template, with placeholders using the [Jinja][jinja] templating engine. And if you call back to `defaults/main.yml`, I left a parameter, where I can render multiple templates to generate the config files for Homepage. Again, here's a practical example of how I use it:

Homepage allows me to show the current weather at my location. It uses [OpenWeather Map][owm] to get that weather. However, OWM requires an API token (which is free) to use their service. Now, I don't want that API key to be stored in my Git repo in plain text, so it should be inserted with a parameter. This is where Jinja comes in:

```yaml
# files/homepage/settings.yml
title: The Homepage
description: Our Homepage
background:
  image: some_image.jpg

providers:
  openweathermap: {{ homepage_openweathermap_key | quote }}
```

In the configuration file for Homepage, I left a placeholder for my API key. But where is it coming from?

## Ansible Vault: The place for your ~~darkest~~ secrets

Vault allows you to store secrets in a secure way, either by encrypting single values, or even whole files. I opt to have a `vault.yml` for each host group, which is fully encrypted using an SSH key. As long as Ansible has access to that key file during runtime, it will automatically be able to decrypt those files and fetch the values from it. But to you as the developer of a role, these secrets look the same as regular variables. Again, here's a practical demonstration:

Suppose I have my key stored in a file called `ansible.key` on my home directory, and a YAML file with my secrets in plain text called `vault.yml`.

```yaml
# vault.yml
homepage_openweathermap_key: 'abc123-567def-890ghi'
```

In my shell, I can export the `ANSIBLE_VAULT_PASSWORD_FILE` environment variable to let ansible know where that key is:

```bash
export ANSIBLE_VAULT_PASSWORD_FILE=~/ansible.key
```

To then encrypt my vault, I can now run `ansible-vault encrypt vault.yml`. Afterwards, your vault file looks something like this:

```
$ANSIBLE_VAULT;1.1;AES256
61353336343135633666363463653733316636393437306162326165666636373332393966393435
6338353266353637373665363966613330313035363661340a316437366233333666653763613336
33366464346162326332303939653431663561373837666532653365313465616461636236646637
3332376439316130660a623231613264386463353065376166616231626331646261366366626532
33653738383638386631386665346634396436383163373861396532366238656362386264646266
64366334313062316363336364356535363362343338313133613865303637303765386630653065
643830383734613864613139626238663666
```

_Cool, but how do I edit this now?_

There's two routes you can take:
1. `ansible-vault decrypt vault.yml` to decrypt it, change the values, then re-encrypt the file again with `ansible-vault encrypt vault.yml`.
2. `ansible-vault edit vault.yml`. This command decrypts the vault into a temporary file, opens your preferred command line editor, and re-encrypts it again, after you saved your changes and closed out of the editor.

I usually go for the second option, as it is far less likely I'd accidentally forget to re-encrypt my vault and commit it in plain text.

## How do I deploy my app then?

Assuming you have your role built, and your secrets configured, the only thing to be done then is to deploy your changes. Assuming you have your host ready, create a Playbook to run:

```yaml
# homepage.yml
---
- name: "Install Homepage"
  hosts: "homepage"
  roles:
    - role: docker    # <- we need Docker installed to run Homepage
    - role: homepage  # <- then actually install Homepage
      homepage_network: 'homepage_net'
```

Next, make sure your inventory file has a group called `homepage` (as I configured this playbook to only run on nodes in the `homepage` group). Here's how this could look like in your inventory file:

```yaml
# inv/site_b/hosts.yml
all:
  vars:  # <- this sets a variable for all hosts in this inventory
    ansible_user: ansible_user
  children:
    homepage:  # <- this creates a group called "homepage"
      hosts:
        10.45.10.11:  # <- this adds a host with the IP 10.45.10.11 to that group
```

I usually place my group variables under `group_vars`, so in this case you'd expect something like this:
```yaml
# inv/site_b/group_vars/homepage/vars.yml
homepage_custom_assets:
  - from: 'files/site_b/gelsenkirchen/bookmarks.yaml'
    to: 'bookmarks.yaml'
homepage_template_assets:
  - from: 'files/site_b/gelsenkirchen/settings.yaml'
    to: 'settings.yaml'
  - from: 'files/site_b/gelsenkirchen/services.yaml'
    to: 'services.yaml'
  - from: 'files/site_b/gelsenkirchen/widgets.yaml'
    to: 'widgets.yaml'
homepage_host_domain: 'homepage.site-b.local'
```

And of course, there's also gonna be a vault file with secrets in it at `inv/site_b/group_vars/homepage/vault.yml`.

Now with all that in place, this command let's you deploy your app:

```bash
ansible-playbook -i inv/site_b/ homepage.yml
```

`-i` tells Ansible what inventory to use, and `homepage.yml` is the playbook we want to run. During deployment, Ansible does all the heavy lifting for us, while we just wait and observe.

## Considerations

If you want to embark on this automation journey, here's some food for thought:

- **Start with something small**, and work your way up. You won't codify your whole infra in just a day without breaking something.
- If you use Proxmox to host your apps, **consider using Snapshots** to restore to a point before you performed changes with your Ansible playbooks. Especially useful while you're developing a new role.
- Once you're done developing your new role, **reset your VM** or container (or even better: delete it and re-create it from a blank VM) **and run your whole play again**. This highlights potentially missing resources, you might have installed manually, or things that have been installed using an earlier iteration of your Ansible code, which is now missing.
- Make it a habit to **_not_ install or change stuff directly**. **Always use your Ansible code**.
- Also consider having a **dedicated VM** or container where you can run Ansible in, a so-called **bastion** or **Ansible host**. Bonus points: Setup your Ansible host _using Ansible_. Why though?
    - **Reduce attack surface**: You could configure your network to not allow SSH traffic to all these hosts, unless initiated by the Ansible host.
    - **Centralized setup**: Instead of setting up Ansible on your desktop, and laptop, you could just connect to that Ansible host and work from basically anywhere (including an iPad, if you fancy that), especially one you pair it with something like VS Code Server (or Neovim, if that floats your boat).
    - **Connection stability**: Combined with a tool like `tmux`, you can run (potentially long running) playbooks without the fear of your network connection dying midway and your servers being left in an unfinished state.

## Appendix: Terraform?

I haven't mentioned yet, that I also use [Terraform][terraform] in my setup. In short, Terraform was made for the Cloud (i.e. AWS, Google Cloud, Azure, ...) to codify and manage infrastructure. There are modules, that also allow you to manage VMs and containers on Proxmox, so that's why I have those here. When I want to create a new VM, I just add it via Terraform. This ensures that whenever I want to add a VM, it's documented, and it has all the necessary setting configured correctly. I mostly wanted to focus on the Ansible setup, but I'll give you some pointers to work with:

I use a provider called [`Telmate/proxmox`][tf-telmate-proxmox], which works quite well, however it is not as fully featured. I've recently also seen another module called [`bpg/proxmox`][tf-bpg-proxmox], but I haven't played around with it. I'm also using a module to pre-calculate the mac address of my VMs and LXC containers, just so the Terraform state is a bit more predictable.

```terraform
resource "macaddress" "transmission" {
  prefix = var.mac_address_prefix
}

resource "proxmox_lxc" "transmission" {
  start           = true
  target_node     = "prx13"
  vmid            = 10122
  hostname        = "CT-Transmission"
  startup         = "order=200,up=5,down=0"
  description     = <<-EOT
    Transmission server hosted at _insert URL here_
  EOT
  ostemplate      = "local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst"
  ssh_public_keys = module.ssh_keys_2025.public_keys

  cores  = 2
  memory = 1024
  tags   = "tf;apps"

  onboot       = true
  unprivileged = false
  features {
    fuse    = true
    nesting = true
    mount   = "nfs;cifs"
  }

  rootfs {
    storage = "quick"
    size    = "16G"
  }

  network {
    name   = "eth0"
    bridge = "vmbr0"
    hwaddr = macaddress.transmission.address
    ip     = "10.45.10.122/24"
    gw     = "10.45.10.1"
    ip6    = "fd45:881d::10:122/64"
    gw6    = "fd45:881d::1"
    tag    = 10
  }
}

output "transmission_server_ips" {
  value = proxmox_lxc.transmission.network.*.ip
}

output "transmission_server_ipv6" {
  value = proxmox_lxc.transmission.network.*.ip6
}
```

This snippet creates a new LXC container based on the provided OS template (Debian 13.1 in this example), configures the IP and MAC addresses, and adds my pre-defined list of SSH keys so I can login as root and perform the rest of my installation using Ansible. The same is also possible for regular VMs, although you can't configure the IP address that way (MAC address should still be possible however).


[ansible]: https://docs.ansible.com
[vs-code-ansible]: https://marketplace.visualstudio.com/items?itemName=redhat.ansible
[ansible-lint]: https://github.com/ansible/ansible-lint
[homepage]: https://gethomepage.dev
[terraform]: https://developer.hashicorp.com/terraform
[jinja]: https://jinja.palletsprojects.com/en/stable/
[owm]: https://openweathermap.org
[tf-telmate-proxmox]: https://registry.terraform.io/providers/telmate/proxmox/latest
[tf-bpg-proxmox]: https://registry.terraform.io/providers/bpg/proxmox/latest
